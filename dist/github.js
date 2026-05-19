export async function getPRFiles(octokit, owner, repo, pullNumber) {
    const files = [];
    const iterator = octokit.paginate.iterator(octokit.rest.pulls.listFiles, { owner, repo, pull_number: pullNumber, per_page: 100 });
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
export async function postComment(octokit, owner, repo, pullNumber, body) {
    await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pullNumber,
        body,
    });
}
