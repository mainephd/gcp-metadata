"use strict";
/**
 * Copyright 2018 Google LLC
 *
 * Distributed under MIT license.
 * See file LICENSE for detail or copy at https://opensource.org/licenses/MIT
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const execa = require("execa");
const ncp_1 = require("ncp");
const tmp = require("tmp");
const util_1 = require("util");
const ncpp = util_1.promisify(ncp_1.ncp);
const keep = !!process.env.GCPM_KEEP_TEMPDIRS;
const stagingDir = tmp.dirSync({ keep, unsafeCleanup: true });
const stagingPath = stagingDir.name;
const pkg = require('../../package.json');
/**
 * Create a staging directory with temp fixtures used to test on a fresh
 * application.
 */
it('should be able to use the d.ts', () => __awaiter(this, void 0, void 0, function* () {
    console.log(`${__filename} staging area: ${stagingPath}`);
    yield execa('npm', ['pack'], { stdio: 'inherit' });
    const tarball = `${pkg.name}-${pkg.version}.tgz`;
    yield ncpp(tarball, `${stagingPath}/${pkg.name}.tgz`);
    yield ncpp('system-test/fixtures/kitchen', `${stagingPath}/`);
    yield execa('npm', ['install'], { cwd: `${stagingPath}/`, stdio: 'inherit' });
}));
/**
 * CLEAN UP - remove the staging directory when done.
 */
after('cleanup staging', () => {
    if (!keep) {
        stagingDir.removeCallback();
    }
});
//# sourceMappingURL=kitchen.test.js.map