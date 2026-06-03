# Contributing to @looker/looker-skills

First off, thank you for considering contributing to Looker Skills! It's people like you that make this repository such a great resource for AI agents and Looker developers.


# How to contribute

We'd love to accept your patches and contributions to this project.

## Before you begin

### Sign our Contributor License Agreement

Contributions to this project must be accompanied by a
[Contributor License Agreement](https://cla.developers.google.com/about) (CLA).
You (or your employer) retain the copyright to your contribution; this simply
gives us permission to use and redistribute your contributions as part of the
project.

If you or your current employer have already signed the Google CLA (even if it
was for a different project), you probably don't need to do it again.

Visit <https://cla.developers.google.com/> to see your current agreements or to
sign a new one.

### Review our community guidelines

This project follows
[Google's Open Source Community Guidelines](https://opensource.google/conduct/).

## Contribution process

### Code reviews

All submissions, including submissions by project members, require review. We
use GitHub pull requests for this purpose. Consult
[GitHub Help](https://help.github.com/articles/about-pull-requests/) for more
information on using pull requests.

### How to Contribute

We welcome all contributions, whether it's adding a new skill or refining an existing one. Here is a quick guide to help you get started:

#### 1. Fork the Repository
Click the **Fork** button in the top-right corner of this repository's GitHub page to create a copy of the repository in your own GitHub account.

#### 2. Clone your Fork
Clone the forked repository to your local machine:

```bash
git clone https://github.com/YOUR-USERNAME/looker-skills.git
cd looker-skills
```

#### 3. Add the Upstream Remote
To keep your fork in sync with the original repository, add it as a remote named `upstream`:

```bash
git remote add upstream https://github.com/looker-open-source/looker-skills.git
```

#### 4. Create a Branch
Before making your changes, create a new branch for your feature, fix, or new skill:

```bash
git checkout -b feature/my-new-skill
```

#### 5. Make your Changes & Test Locally
Add or modify the files within the `skills` directory.

#### 6. Commit and Push
Once you are happy with your changes, commit them and push them up to your fork:

```bash
git add .
git commit -m "Add new skill for LookML formatting"
git push origin feature/my-new-skill
```

#### 7. Create a Pull Request
Go to the original `looker-open-source/looker-skills` repository on GitHub. You should see a prompt to create a pull request from your recently pushed branch. Provide a clear description of the changes you've made.

### Adding a New Skill
When proposing a new skill, please ensure you use the existing skills as a template:
- Place it in the correct subdirectory under `skills/`.
- Ensure it contains a `SKILL.md` file with the frontmatter and content detailing the prompt injection instructions.
- Provide clear task instructions, required parameters, best practices, and code examples.

Thank you for your contributions!
