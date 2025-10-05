const myHeaders = new Headers();
const authHeader = `Basic ${Buffer.from(process.env.TWILLIO_USERNAME_PASSWORD || "").toString("base64")}`;
myHeaders.append("Authorization", authHeader);

/**
 * Utility function to send a single SMS message via Twilio API
 */
const sendSingleSMS = async (messageBody: string): Promise<boolean> => {
  const formdata = new FormData();
  formdata.append("To", "13857706789");
  formdata.append("From", "19133649396");
  formdata.append("Body", messageBody);

  return new Promise<boolean>((resolve) => {
    if (!process.env.TWILLIO_USERNAME_PASSWORD) {
      resolve(true);
      return;
    }
    fetch("https://api.twilio.com/2010-04-01/Accounts/AC258697f0ec08c434f11a2f19de0ce74b/Messages.json", {
      method: "POST",
      headers: myHeaders,
      body: formdata,
    })
      .then(() => {
        resolve(true);
      })
      .catch((error) => {
        console.error("Twillio POST failed!", error);
        resolve(false);
      });
  });
};

/**
 * Sends an SMS message, chunking into multiple messages if necessary
 */
export const sendToMyselfSMS = async (message: string) => {
  const MAX_LENGTH = 1500;

  // Break message into chunks of max 1500 characters
  const chunks: string[] = [];
  if (message.length <= MAX_LENGTH) {
    chunks.push(message);
  } else {
    for (let i = 0; i < message.length; i += MAX_LENGTH) {
      chunks.push(message.slice(i, i + MAX_LENGTH));
    }
  }

  // Determine if we need to add page numbers
  const needsPagination = chunks.length > 1;

  // Send each chunk
  const results = [];
  for (let i = 0; i < Math.min(10, chunks.length); i++) {
    let messageBody = chunks[i];
    if (needsPagination) {
      messageBody += `\n[Page: ${i + 1}]`;
    }

    const result = await sendSingleSMS(messageBody);
    results.push(result);
  }

  // Return true if all chunks were sent successfully
  return results.every((r) => r === true);
};
