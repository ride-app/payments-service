import * as logger from "firebase-functions/logger";
import { region } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2/options";

setGlobalOptions({ maxInstances: 10 });

class ExpectedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExpectedError";
  }
}

initializeApp();

export const createUserWallet = region("asia-south1")
  .auth.user()
  .onCreate((user) => {
    try {
      return getFirestore().collection("wallets").doc(user.uid).set({
        balance: 0,
      });
    } catch (error) {
      logger.error(error);
      return null;
    }
  });

export const reconcile = onDocumentCreated(
  "transactions/{transactionId}",
  async (event) => {
    try {
      if (event?.data?.exists === false) {
        throw new ExpectedError("Document does not exist");
      }

      const firestore = getFirestore();
      const snap = event!.data!;

      if (
        typeof snap.get("walletId") !== "string" ||
        typeof snap.get("amount") !== "number" ||
        typeof snap.get("type") !== "string"
      ) {
        throw new ExpectedError("Invalid transaction data");
      }

      if (snap.get("type") !== "CREDIT" && snap.get("type") !== "DEBIT") {
        throw new ExpectedError("Invalid transaction type");
      }

      return await firestore.runTransaction(async (transaction) => {
        const walletId = snap.get("walletId") as string;
        const amount = snap.get("amount") as number;
        const type = snap.get("type") as string;

        const accountRef = firestore.collection("wallets").doc(walletId);
        const account = await transaction.get(accountRef);

        if (account.exists === false) {
          throw new ExpectedError("Account not found");
        }

        if (type === "CREDIT") {
          transaction.update(accountRef, {
            balance: FieldValue.increment(amount),
            updatedAt: FieldValue.serverTimestamp(),
          });
        } else if (type === "DEBIT") {
          transaction.update(accountRef, {
            balance: FieldValue.increment(-amount),
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      });
    } catch (error) {
      if (error instanceof ExpectedError) {
        logger.error(error);
      } else {
        throw error;
      }
    }
  },
);
