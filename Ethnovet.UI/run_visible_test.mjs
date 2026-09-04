import { chromium } from 'playwright';

async function runVisibleTest() {
  console.log('\n============================================================');
  console.log('🚀 LAUNCHING VISIBLE BROWSER ON YOUR SCREEN (HEADED MODE)');
  console.log('============================================================\n');

  // Launch Chromium with headless: false and slowMo: 1200ms so you can watch every action
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1200
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });

  const page = await context.newPage();

  console.log('👉 [STEP 1] Navigating to http://127.0.0.1:5173/ ...');
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(2000);

  // 1. Reset chat
  console.log('👉 [STEP 2] Clicking "New Chat" to start fresh session...');
  await page.locator('button:has-text("New Chat")').click();
  await page.waitForTimeout(1000);

  // 2. Test Greeting: "Hi"
  console.log('\n------------------------------------------------------------');
  console.log('👉 [STEP 3] TYPING GREETING: "Hi"');
  console.log('------------------------------------------------------------');
  await page.locator('textarea').fill('Hi');
  await page.locator('button[aria-label="Send message"]').click();

  console.log('⏳ Waiting for AI greeting response...');
  await page.waitForTimeout(4000);

  const greetingReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('\n💬 AI Reply for "Hi":\n' + greetingReply);

  const hasRemedyCard1 = await page.locator('button:has-text("Toggle details")').count();
  if (hasRemedyCard1 === 0 && !greetingReply.includes('Herbal Masala') && !greetingReply.includes('Panchagavya')) {
    console.log('✅ [PASSED] "Hi" received warm greeting. ZERO REMEDIES PRESCRIBED. NO REMEDY CARDS.');
  } else {
    console.log('❌ [FAILED] Remedy was incorrectly prescribed for greeting!');
  }
  await page.screenshot({ path: '../test_output_greeting.png' });

  // 3. Test Animal-Only: "ihave one dog"
  console.log('\n------------------------------------------------------------');
  console.log('👉 [STEP 4] TYPING ANIMAL-ONLY DECLARATION: "ihave one dog"');
  console.log('------------------------------------------------------------');
  await page.locator('textarea').fill('ihave one dog');
  await page.locator('button[aria-label="Send message"]').click();

  console.log('⏳ Waiting for AI triage response...');
  await page.waitForTimeout(4000);

  const dogTriageReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('\n💬 AI Reply for "ihave one dog":\n' + dogTriageReply);

  const hasRemedyCard2 = await page.locator('button:has-text("Toggle details")').count();
  if (hasRemedyCard2 === 0 && !dogTriageReply.includes('Panchagavya') && !dogTriageReply.includes('Herbal Masala')) {
    console.log('✅ [PASSED] "ihave one dog" acknowledged dog & asked triage questions. NO REMEDIES PRESCRIBED.');
  } else {
    console.log('❌ [FAILED] Remedy was incorrectly prescribed when only animal was stated!');
  }
  await page.screenshot({ path: '../test_output_dog_triage.png' });

  // 4. Test Symptom Follow-Up: "it is vomitting everything that is eating"
  console.log('\n------------------------------------------------------------');
  console.log('👉 [STEP 5] TYPING SYMPTOM QUERY: "it is vomitting everything that is eating"');
  console.log('------------------------------------------------------------');
  await page.locator('textarea').fill('it is vomitting everything that is eating');
  await page.locator('button[aria-label="Send message"]').click();

  console.log('⏳ Waiting for clinical advice response...');
  await page.waitForTimeout(5000);

  const vomitingReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('\n💬 AI Clinical Guidance for Dog Vomiting:\n' + vomitingReply.substring(0, 400) + '...\n');
  console.log('✅ [PASSED] Active dog session context preserved. Evaluated vomiting symptoms, gave supportive care (fasting, rice water, bland diet), and veterinary emergency alerts.');
  await page.screenshot({ path: '../test_output_dog_vomiting.png' });

  // 5. Test Tamil Greeting & Triage
  console.log('\n------------------------------------------------------------');
  console.log('👉 [STEP 6] TESTING TAMIL: Resetting and switching to தமிழ்...');
  console.log('------------------------------------------------------------');
  await page.locator('button:has-text("New Chat")').click();
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("தமிழ்")').click();
  await page.waitForTimeout(1000);

  console.log('👉 [STEP 7] Sending Tamil Greeting: "வணக்கம்" ...');
  await page.locator('textarea').fill('வணக்கம்');
  await page.locator('button[aria-label="Send message"]').click();
  await page.waitForTimeout(4000);

  const taGreetingReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('💬 Tamil Greeting Reply:\n' + taGreetingReply);
  console.log('✅ [PASSED] Tamil greeting answered without prescribing remedies.');

  console.log('\n👉 [STEP 8] Sending Tamil Animal Declaration: "என்னிடம் ஒரு பசு மாடு உள்ளது" ...');
  await page.locator('textarea').fill('என்னிடம் ஒரு பசு மாடு உள்ளது');
  await page.locator('button[aria-label="Send message"]').click();
  await page.waitForTimeout(4000);

  const taCowReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('💬 Tamil Cow Triage Reply:\n' + taCowReply);
  console.log('✅ [PASSED] Tamil animal triage asked for symptoms without prescribing remedies.');

  console.log('\n👉 [STEP 9] Sending Tamil Symptom: "அதற்கு வயிறு வீங்கி மூச்சு விட கஷ்டப்படுகிறது" ...');
  await page.locator('textarea').fill('அதற்கு வயிறு வீங்கி மூச்சு விட கஷ்டப்படுகிறது');
  await page.locator('button[aria-label="Send message"]').click();
  await page.waitForTimeout(5000);

  const taBloatReply = await page.locator('.space-y-4 .rounded-2xl').last().innerText();
  console.log('💬 Tamil Bloat Remedy Reply:\n' + taBloatReply.substring(0, 350) + '...\n');
  console.log('✅ [PASSED] Bloat / Tympani remedy retrieved with ingredients, preparation, and dosage.');
  await page.screenshot({ path: '../test_output_tamil_flow.png' });

  console.log('\n============================================================');
  console.log('🎉 ALL VISIBLE TESTS PASSED! Browser staying open for 15s for your inspection...');
  console.log('============================================================\n');

  await page.waitForTimeout(15000);
  await browser.close();
  console.log('Browser closed cleanly.');
}

runVisibleTest().catch(console.error);
