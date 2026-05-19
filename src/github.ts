import * as github from "@actions/github";

export interface PRFile {
  filename: string;
  patch?: string;
  additions: number;
  deletions: number;
  changes: number;
}

export async function getPRFiles(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<PRFile[]> {
  const files: PRFile[] = [];
  const iterator = octokit.paginate.iterator(
    octokit.rest.pulls.listFiles,
    { owner, repo, pull_number: pullNumber, per_page: 100 },
  );

  for await (const { data } of iterator) {
    for (const f of data) {
      files.push({
        filename: f.filename,
        patch: f.patch,
        additions: f.additions,
        deletions: f.deletions,
        changes: f.changes,
      });
    }
  }

  return files;
}

export async function postComment(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  pullNumber: number,
  body: string,
): Promise<void> {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
}
