import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Function to dynamically import contributors from compiled TypeScript
async function importContributorsFromTS() {
  try {
    // Import from the compiled JS file
    const contributorsModule = await import('./temp/contributors.js');
    const { contributors } = contributorsModule;

    console.log(
      `✅ Successfully imported ${contributors.length} contributors from compiled TypeScript`
    );
    return contributors;
  } catch (error) {
    console.error('❌ Failed to import contributors from compiled TypeScript:', error.message);
    console.error('Make sure to run "npm run compile-contributors" first');
    process.exit(1);
  }
}

async function updateReadmeAcknowledgments() {
  try {
    // Dynamically import contributors data from TypeScript file
    const contributors = await importContributorsFromTS();

    // Get contributors by role
    const getContributorsByRole = (roleType) => {
      return contributors.filter((contributor) =>
        contributor.roles.some((role) => role.type === roleType)
      );
    };

    // Filter out project maintainers from acknowledgments to avoid awkward self-thanks
    const filterOutProjectMaintainers = (contributors) => {
      return contributors.filter(
        (contributor) => !contributor.roles.some((role) => role.type === '项目维护者')
      );
    };

    const toMarkdownName = (name) => {
      // Preserve double spaces in GitHub markdown by converting to nbsp
      // Also escape underscores to avoid italics
      const escaped = name.replace(/_/g, '\\_');
      return escaped.replace(/  /g, '&nbsp;&nbsp;');
    };

    const formatContributors = (contributors) => {
      return contributors
        .map((contributor) =>
          contributor.url
            ? `[${toMarkdownName(contributor.name)}](${contributor.url})`
            : toMarkdownName(contributor.name)
        )
        .join('、');
    };

    // Generate acknowledgment lines based on RoleType enum values
    const acknowledgmentLines = [];

    // Data testers (提供测试数据)
    const dataTesters = filterOutProjectMaintainers(getContributorsByRole('提供测试数据'));
    if (dataTesters.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(dataTesters)} 提供测试数据`);
    }

    // Art providers (分享图片素材)
    const artProviders = filterOutProjectMaintainers(getContributorsByRole('分享图片素材'));
    if (artProviders.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(artProviders)} 分享图片素材`);
    }

    // Developers (进行项目开发)
    const developers = filterOutProjectMaintainers(getContributorsByRole('进行项目开发'));
    if (developers.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(developers)} 进行项目开发`);
    }

    // Content writers (撰写角色文案)
    const contentWriters = filterOutProjectMaintainers(getContributorsByRole('撰写角色文案'));
    if (contentWriters.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(contentWriters)} 撰写角色文案`);
    }

    // Content proofreaders (进行文案校对)
    const proofreaders = filterOutProjectMaintainers(getContributorsByRole('进行文案校对'));
    if (proofreaders.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(proofreaders)} 进行文案校对`);
    }

    // Video creators (制作教学视频)
    const videoCreators = filterOutProjectMaintainers(getContributorsByRole('制作教学视频'));
    if (videoCreators.length > 0) {
      acknowledgmentLines.push(`- ${formatContributors(videoCreators)} 制作教学视频`);
    }

    // Read current README
    const readmePath = join(projectRoot, 'README.md');
    let readmeContent = readFileSync(readmePath, 'utf-8');

    // Find and replace the acknowledgments section
    const startMarker = '**特别鸣谢:**';
    const endMarker = '\n---';

    const startIndex = readmeContent.indexOf(startMarker);
    const endIndex = readmeContent.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
      console.error('Could not find acknowledgments section markers in README.md');
      return;
    }

    const beforeSection = readmeContent.substring(0, startIndex + startMarker.length);
    const afterSection = readmeContent.substring(endIndex);

    const newAcknowledgments =
      acknowledgmentLines.length > 0
        ? `\n\n${acknowledgmentLines.join('\n')}\n`
        : '\n\n（暂无特别鸣谢）\n';

    const newReadmeContent = beforeSection + newAcknowledgments + afterSection;

    // Write back to README
    writeFileSync(readmePath, newReadmeContent, 'utf-8');
    console.log('✅ README acknowledgments updated successfully!');
  } catch (error) {
    console.error('❌ Error updating README acknowledgments:', error.message);
    process.exit(1);
  }
}

updateReadmeAcknowledgments();
