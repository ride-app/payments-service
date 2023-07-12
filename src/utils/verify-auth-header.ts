import { getAuth } from "firebase-admin/auth";
import { Code, ConnectError, type HandlerContext } from "@bufbuild/connect";

const verifyAuthHeader = async (context: HandlerContext): Promise<string> => {
	try {
		if (context.requestHeader.get("authorization").length === 0) {
			throw new ConnectError("Missing Authorization", Code.Unauthenticated);
		}
		const token = context.requestHeader.get("authorization").toString();

		console.debug("Token: ", token);

		if (!token.startsWith("Bearer ")) {
			throw new ConnectError("Invalid Authorization", Code.Unauthenticated);
		}

		return (await getAuth().verifyIdToken(token.split("Bearer ")[1])).uid;
	} catch (e) {
		throw new ConnectError("Invalid Authorization", Code.Unauthenticated);
	}
};

export default verifyAuthHeader;
