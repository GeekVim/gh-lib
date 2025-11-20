// @ts-check
/** @param {import('github-script').AsyncFunctionArguments} AsyncFunctionArguments */
module.exports = async ({ github, context }) => {
  const owner = context.payload.organization ?? context.repo.owner;

  const { data: repos } =
    (context.payload.organization !== null) ?
      await github.rest.repos.listForOrg({
        org: context.repo.owner,
        type: 'all',
        per_page: 100
      })
    :
      await github.rest.repos.listForUser({
        username: context.repo.owner,
        type: 'all',
        per_page: 100
      });


  const LABELS = [
    { name: "stale", color: "F9D0C4" },
    { name: "upstream", color: "FBCA04" },
    { name: "autorelease: pending", color: "0e8a16" },
    { name: "vacation", color: "1D76DB" },
    { name: "pinned", color: "D4C5F9" },
  ];

  for (const repo of repos) {
    if (repo.fork || repo.archived || repo.disabled) {
      continue;
    }

    try {
      const { data: contents } = await github.rest.repos.getContent({
        owner: context.repo.owner,
        repo: repo.name,
        path: '', // Request contents of the root directory
      });
      if (contents && contents.length == 0) {
        console.log('Repository appears to be empty (no contents found).');
        continue;
      }
    } catch (error) {
      if (error.status === 404) {
        console.log('Repository appears to be empty (404 Not Found for content).');
        continue;
      } else {
        console.error('Error checking repository content:', error);
        core.setFailed(`Failed to check repository content: ${error.message}`);
      }
    }

    console.log(`Updating ${repo.full_name}...`);
    // Enable repository settings
    await github.rest.repos.update({
      owner: context.repo.owner,
      repo: repo.name,
      allow_update_branch: true,
      has_discussions: true,
      allow_squash_merge: true,
      allow_rebase_merge: true,
      allow_merge_commit: false,
      has_wiki: true,
      squash_merge_commit_title: "PR_TITLE",
      squash_merge_commit_message: "PR_BODY",
    });

    // Update branch protection
    await github.rest.repos.updateBranchProtection({
      owner: context.repo.owner,
      repo: repo.name,
      branch: repo.default_branch,
      allow_deletions: false,
      allow_force_pushes: false,
      allow_fork_syncing: false,
      block_creations: false,
      enforce_admins: false,
      lock_branch: false,
      required_conversation_resolution: false,
      required_linear_history: false,
      required_signatures: false,
      required_status_checks: null,
      required_pull_request_reviews: null,
      restrictions: null,
    });

    // Labels
    const labels = await github.rest.issues.listLabelsForRepo({
      owner: context.repo.owner,
      repo: repo.name,
    });
    for (const label of LABELS) {
      const existing = labels.data.find(
        (l) => l.name.toLowerCase() === label.name.toLowerCase(),
      );
      if (
        existing?.color === label.color &&
        existing?.description === label.description
      ) {
        continue;
      }
      if (existing) {
        await github.rest.issues.updateLabel({
          owner: context.repo.owner,
          repo: repo.name,
          name: label.name,
          new_name: label.name,
          color: label.color,
        });
      } else {
        try {
          await github.rest.issues.createLabel({
            owner: context.repo.owner,
            repo: repo.name,
            name: label.name,
            color: label.color,
          });
        } catch (error) {
          console.log(error);
        }
      }
    }
  }
};
