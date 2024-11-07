const express = require('express')
const app = express()

// Instantiating formsg-sdk without parameters default to using the package's
// production public signing key.
const formsg = require('@opengovsg/formsg-sdk')()

// This is where your domain is hosted, and should match
// the URI supplied to FormSG in the form dashboard
const POST_URI = process.env.POST_URI;
// Your form's secret key downloaded from FormSG upon form creation
let formSecretKey = process.env.FORM_SECRET_KEY
const mformSecretKey = {
  "671a69259c57efa2b22c635d":"Y0KsmzJwZp48w1QjXJDd+weJbOtiBIv+08Fg1m0CVcw=",
  "671a68a0b188c38b559ba87c":"S8iFHSyABGkY2PFaNeo4Z21fv4UcfkBFvXY/2/M4AB8=",
  "671b59f4de58b089be023b37":"wpV8ya7d0xN54CiiyNUEDf94d6hcg6HkdTWHEbvad18="
}
// Set to true if you need to download and decrypt attachments from submissions
let HAS_ATTACHMENTS = false

app.post(
  '/submissions',
  // Endpoint authentication by verifying signatures
  function (req, res, next) {
    try {
      formsg.webhooks.authenticate(req.get('X-FormSG-Signature'), POST_URI)
      // Continue processing the POST body
      return next()
    } catch (e) {
        console.log('error here!', e)
      return res.status(401).send({ message: 'Unauthorized' })
    }
  },
  // Parse JSON from raw request body
  express.json(),
  // Decrypt the submission
  async function (req, res, next) {
    // If `verifiedContent` is provided in `req.body.data`, the return object
    // will include a verified key.
    formSecretKey = mformSecretKey[req.body.data.formId];
    console.log('What is the secret', formSecretKey);
    console.log("What is the Body? ",req.body.data);
    HAS_ATTACHMENTS = req.body.data.attachmentDownloadUrls ? true :false;
    const submission = HAS_ATTACHMENTS
      ? await formsg.crypto.decryptWithAttachments(formSecretKey, req.body.data)
      : formsg.crypto.decrypt(formSecretKey, req.body.data)

    // If the decryption failed, submission will be `null`.
    if (submission) {
        console.log("Submission");
        console.log(submission);
        console.log("ATtachment");
        const b64 = Buffer.from(submission.attachments["672b4cd51fa81d4f4ab36645"].content).toString('base64');
        console.log(b64);
      // Continue processing the submission
    } else {
        console.log('unable to decrypt')
      // Could not decrypt the submission
    }
  }
)

app.listen(8000, () => console.log('Running on port 8000'))
