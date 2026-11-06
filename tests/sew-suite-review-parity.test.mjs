import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync('src/pages/Reviews.jsx','utf8');
test('Sew Suite review destination and QR survive missing optional catalog fields',()=>{
 assert.match(page,/https:\/\/g\.page\/r\/CcQkIwJmCP0ZEAE\/review/);
 assert.match(page,/sew-suite-google-review-qr\.svg/);
 assert.match(page,/Leave a Google Review/);
 assert.match(page,/googleUrl && googleQrUrl/);
 assert.match(page,/settings\?\.google_review_url \|\|/);
});
