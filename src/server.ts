import * as grpc from '@grpc/grpc-js';
import server from './app';

const port = process.env.PORT || 5000;

server.bindAsync(
	`localhost:${port}`,
	grpc.ServerCredentials.createInsecure(),
	(err, p) => {
		if (err) {
			throw err;
		}

		server.start();
		console.info(`${Date.now()}: server listening to port ${p}`);
	}
);
