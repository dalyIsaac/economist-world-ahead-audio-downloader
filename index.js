import playwright from "playwright";
import dotenv from "dotenv";
import invariant from "invariant";
import fs from "fs";
import https from "https";

dotenv.config();

const {
  ECONOMIST_USERNAME,
  ECONOMIST_PASSWORD,
  ECONOMIST_AUTH_URL,
  OUTPUT_DIR,
  SOURCE_PAGE,
} = process.env;

for (const key of [
  ECONOMIST_USERNAME,
  ECONOMIST_PASSWORD,
  ECONOMIST_AUTH_URL,
  OUTPUT_DIR,
  SOURCE_PAGE,
]) {
  invariant(
    key,
    "Please set the environment variables ECONOMIST_USERNAME, ECONOMIST_PASSWORD, OUTPUT_DIR, SOURCE_PAGE"
  );
}

/**
 * Get the audio file URL from the given article
 * @param {import("playwright").BrowserContext} context
 * @param {string} url
 * @param {number} index
 */
async function downloadFile(context, url, index) {
  // Open a new tab
  const page = await context.newPage();
  await page.goto(url);

  // Get the name of the article
  let title = await page.$("h1").then((h1) => h1.textContent());
  title = title.replace(/[^a-zA-Z0-9]/g, "-");

  // Get the audio element
  const audio = await page.$("audio");

  // Get the source of the audio element
  const src = await audio.getAttribute("src");

  // Save the file
  const file = fs.createWriteStream(`${OUTPUT_DIR}/${index}-${title}.mp3`, {
    flags: "w",
  });
  https.get(src, (response) => {
    response.pipe(file);

    file.on("finish", () => {
      file.close();
      console.log(`Downloaded ${index}-${title}.mp3`);
    });
  });

  await page.close();
}

const main = async () => {
  const browser = await playwright.chromium.launch({
    headless: false,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://www.economist.com/");

  // Accept all cookies
  try {
    await page
      .frameLocator('internal:attr=[title="SP Consent Message"i]')
      .getByRole("button", { name: "Accept all" })
      .click();
  } catch (error) {
    console.log(error);
  }

  // Sign in
  await page.goto(ECONOMIST_AUTH_URL);
  await page.getByLabel("*Email address").click();
  await page.getByLabel("*Email address").fill(ECONOMIST_USERNAME);
  await page.getByLabel("*Email address").press("Tab");

  await page.getByLabel("*Password").fill(ECONOMIST_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForNavigation();

  // Go to the World Ahead page
  await page.goto(SOURCE_PAGE);

  // Get all links which start with "/the-world-ahead/20"
  const links = await page.locator("a").all();
  const filteredLinks = [];
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href.startsWith("/the-world-ahead/20")) {
      filteredLinks.push(`https://www.economist.com${href}`);
    }
  }

  console.log(`Found ${filteredLinks.length} links`);

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  // Download all files
  const failed = [];
  for (let i = 0; i < filteredLinks.length; i += 5) {
    await Promise.allSettled(
      filteredLinks.slice(i, i + 5).map(async (link, index) => {
        try {
          await downloadFile(context, link, i + index);
        } catch (error) {
          console.error(error);
          failed.push(link);
        }
      })
    );
  }

  console.log(`Failed to download ${failed.length} files`);
  console.log(failed);

  // ---------------------
  await context.close();
  await browser.close();
};

main();
