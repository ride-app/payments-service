import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const serviceName =
  new pulumi.Config("service").get("name") || pulumi.getProject();
const location = gcp.config.region || "asia-east1";

const github_connection = gcp.cloudbuildv2.Connection.get(
  "github-connection",
  pulumi.interpolate`projects/${gcp.config.project}/locations/${location}/connections/GitHub`,
);

const repository = new gcp.cloudbuildv2.Repository("repository", {
  location,
  parentConnection: github_connection.name,
  remoteUri: pulumi.interpolate`https://github.com/ride-app/${serviceName}.git`,
});

new gcp.cloudbuild.Trigger("build-trigger", {
  location,
  repositoryEventConfig: {
    repository: repository.id,
    push: {
      branch: "^main$",
    },
  },
  substitutions: {
    _LOG_DEBUG: new pulumi.Config().get("logDebug") ?? "false",
  },
  filename: "cloudbuild.yaml",
  includeBuildLogs: "INCLUDE_BUILD_LOGS_WITH_STATUS",
});
