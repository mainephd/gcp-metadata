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
const assert = require("assert");
const execa = require("execa");
const fs = require("fs");
const gcx = require("gcx");
const googleapis_1 = require("googleapis");
const node_fetch_1 = require("node-fetch");
const path = require("path");
const util_1 = require("util");
const uuid = require("uuid");
const mv = util_1.promisify(fs.rename);
const pkg = require('../../package.json');
const projectId = process.env.GCLOUD_PROJECT;
if (!projectId) {
    throw new Error('Please set the `GCLOUD_PROJECT` environment variable.');
}
let gcf;
const shortPrefix = 'gcloud-tests';
const fullPrefix = `${shortPrefix}-${uuid.v4().split('-')[0]}`;
describe('gcp metadata', () => {
    before(() => __awaiter(this, void 0, void 0, function* () {
        // Clean up any old cloud functions just hanging out
        gcf = yield getGCFClient();
        yield pruneFunctions(false);
        // pack up the gcp-metadata module and copy to the target dir
        yield packModule();
        // deploy the function to GCF
        yield deployApp();
    }));
    it('should access the metadata service on GCF', () => __awaiter(this, void 0, void 0, function* () {
        const url = `https://us-central1-${projectId}.cloudfunctions.net/${fullPrefix}`;
        const res = yield node_fetch_1.default(url);
        if (res.status === 200) {
            const metadata = yield res.json();
            console.log(metadata);
            assert.strictEqual(metadata.isAvailable, true);
        }
        else {
            const text = yield res.text();
            console.error(text);
            assert.fail('Request to the deployed cloud function failed.');
        }
    }));
    after(() => pruneFunctions(true));
});
/**
 * Create a new GCF client using googleapis, and ensure it's
 * properly authenticated.
 */
function getGCFClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const auth = yield googleapis_1.google.auth.getClient({ scopes: 'https://www.googleapis.com/auth/cloud-platform' });
        return googleapis_1.google.cloudfunctions({ version: 'v1', auth });
    });
}
/**
 * Delete all cloud functions created in the project by this
 * test suite. It can delete ones created in this session, and
 * also delete any of them created > 7 days ago by tests.
 * @param sessionOnly Only prune functions created in this session.
 */
function pruneFunctions(sessionOnly) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Pruning leaked functions...');
        const res = yield gcf.projects.locations.functions.list({ parent: `projects/${projectId}/locations/-` });
        const fns = res.data.functions || [];
        yield Promise.all(fns.filter(fn => {
            if (sessionOnly) {
                return fn.name.includes(fullPrefix);
            }
            const updateDate = (new Date(fn.updateTime)).getTime();
            const currentDate = Date.now();
            const minutesSinceUpdate = (currentDate - updateDate) / 1000 / 60;
            return (minutesSinceUpdate > 60 && fn.name.includes(shortPrefix));
        })
            .map((fn) => __awaiter(this, void 0, void 0, function* () {
            yield gcf.projects.locations.functions.delete({ name: fn.name })
                .catch(e => {
                console.error(`There was a problem deleting function ${fn.name}.`);
                console.error(e);
            });
        })));
    });
}
/**
 * Deploy the hook app to GCF.
 */
function deployApp() {
    return __awaiter(this, void 0, void 0, function* () {
        const targetDir = path.join(__dirname, '../../system-test/fixtures/hook');
        yield gcx.deploy({
            name: fullPrefix,
            entryPoint: 'getMetadata',
            triggerHTTP: true,
            runtime: 'nodejs8',
            region: 'us-central1',
            targetDir
        });
    });
}
/**
 * Runs `npm pack` on the root directory, and copies the resulting
 * `gcp-metadata.tgz` over to the hook directory in fixtures.
 */
function packModule() {
    return __awaiter(this, void 0, void 0, function* () {
        yield execa('npm', ['pack'], { stdio: 'inherit' });
        const from = `${pkg.name}-${pkg.version}.tgz`;
        const to = `system-test/fixtures/hook/${pkg.name}.tgz`;
        yield mv(from, to);
    });
}
//# sourceMappingURL=system.js.map