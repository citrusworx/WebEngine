# Stash, pull, and push safely in PowerShell

A stash temporarily saves uncommitted edits in your local Git repository. To share those edits, restore them, review them, commit them, and push the commit.

## 1. Save the work you want to set aside

From the CitrusWorx repository in PowerShell:

```powershell
git status --short --branch
git diff
git diff --staged
git stash push -u -m "WIP: describe the changes here"
git stash list
git stash show --include-untracked --stat 'stash@{0}'
```

`-u` includes untracked files. It skips ignored files, which often include build output, local settings, or secrets. If Git says there are no local changes to save, it did not create a new stash. The newest stash is usually `stash@{0}`. Its number can change when you add or remove an entry, so match the description before using it. Quote stash references in PowerShell.

## 2. Pull the latest changes

Use this when updating the local `master` branch:

```powershell
git switch master
git pull --ff-only origin master
```

`--ff-only` updates the branch when Git can move it forward directly. If the branches have diverged, inspect the commits on both sides before deciding how to integrate them:

```powershell
git fetch origin
git log --left-right --oneline HEAD...origin/master
```

A clean working tree only tells you that there are no unstaged or staged edits. The branch can still contain local commits.

## 3. Restore the stash on a feature branch

Use a fresh branch name. Starting it at `origin/master` keeps any local-only commits on `master` out of the feature branch.

```powershell
git switch -c my-feature origin/master
git stash list
git stash show --include-untracked --patch 'stash@{0}'
git stash apply 'stash@{0}'
git status --short
```

`git stash apply` keeps the stash as a backup. Use the stash you inspected, even if its number differs from this example.

If Git reports a conflict, run `git status` to find the affected files. Open each file, combine the changes you want, and remove any conflict markers. Stage each resolved file with `git add -- path/to/resolved-file`, replacing the example with the actual path. For a file that should be deleted, stage that decision with `git rm -- path/to/deleted-file`. Check for remaining conflicts with:

```powershell
git diff --name-only --diff-filter=U
```

Wait until that command prints no paths before committing. If a stash only partially applied, inspect the working tree before trying anything again.

## 4. Review, commit, and push

The path below is an example. Stage only the files you reviewed, then run the repository checks relevant to your changes.

```powershell
git diff
git add -- docs/juice/juice-sheet.md
git diff --staged --stat
git diff --staged
git commit -m "Describe the change"
git log --oneline origin/master..HEAD
git push -u origin HEAD
```

The commit list shows what your feature branch adds to the remote base. Inspect it before pushing, especially if you created the branch from a local branch with pending commits. If Git rejects the push, fetch and inspect the remote branch before retrying.

Verify that the SHA from `git rev-parse HEAD` matches the SHA on GitHub. Replace `my-feature` with your branch name:

```powershell
git rev-parse HEAD
git ls-remote --exit-code origin refs/heads/my-feature
```

Once the push is verified and you are sure every edit you want from the stash is accounted for, run `git stash list` again and drop the matching entry. For example, if it is still the newest stash:

```powershell
git stash drop 'stash@{0}'
```

Keep the stash if it contains additional work you still need.

## When the work is already committed

If the stash shows different files than you expected, look at the commits that are on local `master` but missing from `origin/master`:

```powershell
git stash show --include-untracked --stat 'stash@{0}'
git log --oneline origin/master..master
git show --stat 8eaf9ab0
```

In the Juice case, the latest stash held OpenCode configuration deletions and a `.gitignore` edit. The accessibility fix was already in local commit `8eaf9ab0`, alongside unrelated files. For a mixed commit like this, start a feature branch from `origin/master` and bring over only the reviewed patch for the files you intend to share. A separate Git worktree lets you prepare that branch without switching your main checkout.
