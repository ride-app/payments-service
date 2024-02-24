import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const serviceName =
  new pulumi.Config("service").get("name") || pulumi.getProject();
const location = gcp.config.region || "asia-east1";

const bucket = new gcp.storage.Bucket("bazel-remote-cache", {
  location, // Replace with desired location if needed.
  uniformBucketLevelAccess: true,
});

// IAM policy to allow the specific service account read and write access to the bucket
const bucketIAMMemberUser = new gcp.storage.BucketIAMMember(
  "bucketIAMMemberUser",
  {
    bucket: bucket.name,
    role: "roles/storage.objectUser",
    member: `serviceAccount:${gcp.config.project}@cloudbuild.gserviceaccount.com`,
  },
);

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
    _BAZEL_REMOTE_CACHE_BUCKET: bucket.name,
    _LOG_DEBUG: new pulumi.Config().get("logDebug") ?? "false",
  },
  filename: "cloudbuild.yaml",
  includeBuildLogs: "INCLUDE_BUILD_LOGS_WITH_STATUS",
});
