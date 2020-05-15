import { registerPlugin, scullyConfig } from '@scullyio/scully';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const escapeRegExp = (string): string => {
  // $& means the whole matched string
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const delayAngularPlugin = async (html, route) => {
  const tsConfigPath = 'tsconfig.json';
  const tsConfig = JSON.parse(readFileSync(tsConfigPath, { encoding: 'utf8' }).toString());

  let isEs5Config = false;
  let statsJsonPath = join(scullyConfig.distFolder, 'stats-es2015.json');
  if (tsConfig.compilerOptions.target === 'es5') {
    isEs5Config = true;
    statsJsonPath = join(scullyConfig.distFolder, 'stats.json');
  }

  if (!existsSync(statsJsonPath)) {
    const noStatsJsonError = `A ${isEs5Config ? 'stats' : 'stats-es2015'}.json is required for the 'delayAngular' plugin.
Please run 'ng build' with the '--stats-json' flag`;
    console.error(noStatsJsonError);
    throw new Error(noStatsJsonError);
  }

  const scullyDelayAngularStatsJsonPath = join(scullyConfig.distFolder, 'scully-plugin-delay-angular-stats.json');
  let scullyDelayAngularStatsJson = [];
  if (!existsSync(scullyDelayAngularStatsJsonPath)) {
    const errorCreatingScullyDelayAngularStatsJsonError = 'The scully-plugin-delay-angular-stats.json could not be created';
    try {
      scullyDelayAngularStatsJson = JSON.parse(readFileSync(statsJsonPath, { encoding: 'utf8' }).toString()).assets;
      writeFileSync(scullyDelayAngularStatsJsonPath, JSON.stringify(scullyDelayAngularStatsJson));
    } catch (e) {
      console.error(e);
      console.error(errorCreatingScullyDelayAngularStatsJsonError);
      throw new Error(errorCreatingScullyDelayAngularStatsJsonError);
    }
  } else {
    scullyDelayAngularStatsJson = JSON.parse(readFileSync(scullyDelayAngularStatsJsonPath, { encoding: 'utf8' }).toString());
  }

  let assetsList = scullyDelayAngularStatsJson.filter(entry => {
    return entry['name'].includes('.js') && (
      entry['name'].includes('-es5') || entry['name'].includes('-es2015')
    );
  }).map(entry => entry['name']);
  assetsList = [...assetsList, ...assetsList.map(asset => {
    return asset.includes('-es5') ?
      asset.replace('-es5', '-es2015') :
      asset.replace('-es2015', '-es5');
  })];
  let appendScript = `
  <script>
      function appendModuleScript(entry) {
        var s = document.createElement("script");
        s.setAttribute("type", "module");
        s.src = entry;
        s.setAttribute("defer", "");
        s.onload = function () {
          console.log('script is loaded!')
         };
        document.body.appendChild(s);
      }
      function appendNoModuleScript(entry) {
        var s = document.createElement("script");
        s.setAttribute("nomodule", "");
        s.src = entry;
        s.setAttribute("defer", "");
        s.onload = function () {
          console.log('script is loaded!')
         };
        document.body.appendChild(s);
      }
      window.addEventListener('load', function(event) {
          setTimeout( function() {
            var pattes2015 = new RegExp("-es2015");
            var pattes5 = new RegExp("-es5");
            var moduleScripts = [];
            var noModuleScripts = []'
            `
            
  assetsList.forEach(entry => {
    const regex = new RegExp(`<script( charset="?utf-8"?)? src="?${escapeRegExp(entry)}"?( type="?module"?)?( nomodule(="")?)?( defer(="")?)?><\/script>`, 'gmi');
    appendScript += `
                    if(pattes2015.test('${entry}')) {
                      moduleScripts.push("${entry}");
                    } else if(pattes5.test('${entry}')) {
                      noModuleScripts.push("${entry}");
                    }
                    moduleScripts.forEach(entry => {
                      appendModuleScript(entry);
                    });
                    noModuleScripts.forEach(entry => {
                      appendNoModuleScript(entry);
                    });
                `
    html = html.replace(regex, appendScript);
  });
  appendScript += `
        }, 5000);
      });
      </script>
  `
  return Promise.resolve(html);
};

// no validation implemented
const delayAngularPluginValidator = async () => [];
export const DelayAngular = 'delayAngular';
registerPlugin('render', DelayAngular, delayAngularPlugin);
