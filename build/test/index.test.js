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
const nock = require("nock");
const gcp = require("../src");
const assertRejects = require('assert-rejects');
const HOST = gcp.HOST_ADDRESS;
const PATH = gcp.BASE_PATH;
const BASE_URL = gcp.BASE_URL;
const HEADER_NAME = gcp.HEADER_NAME;
const TYPE = 'instance';
const PROPERTY = 'property';
// NOTE: nodejs switches all incoming header names to lower case.
const HEADERS = {
    [gcp.HEADER_NAME.toLowerCase()]: gcp.HEADER_VALUE
};
nock.disableNetConnect();
afterEach(() => {
    nock.cleanAll();
});
it('should create the correct accessors', () => __awaiter(this, void 0, void 0, function* () {
    assert(typeof gcp.instance, 'function');
    assert(typeof gcp.project, 'function');
}));
it('should access all the metadata properly', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}`, undefined, HEADERS)
        .reply(200, {}, HEADERS);
    yield gcp.instance();
    scope.done();
}));
it('should access a specific metadata property', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}/${PROPERTY}`).reply(200, {}, HEADERS);
    yield gcp.instance(PROPERTY);
    scope.done();
}));
it('should set custom headers when supplied', () => __awaiter(this, void 0, void 0, function* () {
    const headers = { human: 'phone', monkey: 'banana' };
    const scope = nock(HOST, { reqheaders: headers })
        .get(`${PATH}/${TYPE}/${PROPERTY}`)
        .reply(200, {}, HEADERS);
    yield gcp.instance({ property: PROPERTY, headers });
    scope.done();
}));
it('should return large numbers as BigNumber values', () => __awaiter(this, void 0, void 0, function* () {
    const BIG_NUMBER_STRING = `3279739563200103600`;
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}/${PROPERTY}`)
        .reply(200, BIG_NUMBER_STRING, HEADERS);
    const property = yield gcp.instance(PROPERTY);
    // property should be a BigNumber.
    assert.strictEqual(property.valueOf(), BIG_NUMBER_STRING);
    scope.done();
}));
it('should return small numbers normally', () => __awaiter(this, void 0, void 0, function* () {
    const NUMBER = 32797;
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}/${PROPERTY}`)
        .reply(200, `${NUMBER}`, HEADERS);
    const property = yield gcp.instance(PROPERTY);
    assert.strictEqual(typeof property, 'number');
    assert.strictEqual(property, NUMBER);
    scope.done();
}));
it('should deal with nested large numbers', () => __awaiter(this, void 0, void 0, function* () {
    const BIG_NUMBER_STRING = `3279739563200103600`;
    const RESPONSE = `{ "v1": true, "v2": ${BIG_NUMBER_STRING} }`;
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}/${PROPERTY}`)
        .reply(200, RESPONSE, HEADERS);
    const response = yield gcp.instance(PROPERTY);
    assert.strictEqual(response.v2.valueOf(), BIG_NUMBER_STRING);
    scope.done();
}));
it('should accept an object with property and query fields', () => __awaiter(this, void 0, void 0, function* () {
    const QUERY = { key: 'value' };
    const scope = nock(HOST)
        .get(`${PATH}/project/${PROPERTY}`)
        .query(QUERY)
        .reply(200, {}, HEADERS);
    yield gcp.project({ property: PROPERTY, params: QUERY });
    scope.done();
}));
it('should return the request error', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).times(4).reply(500, undefined, HEADERS);
    yield assertRejects(gcp.instance(), /Unsuccessful response status code/);
    scope.done();
}));
it('should return error when res is empty', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).reply(200, null, HEADERS);
    yield assertRejects(gcp.instance());
    scope.done();
}));
it('should return error when flavor header is incorrect', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}`)
        .reply(200, {}, { [gcp.HEADER_NAME.toLowerCase()]: 'Hazelnut' });
    yield assertRejects(gcp.instance(), /Invalid response from metadata service: incorrect Metadata-Flavor header./);
    scope.done();
}));
it('should return error if statusCode is not 200', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).reply(418, {}, HEADERS);
    yield assertRejects(gcp.instance(), /Unsuccessful response status code/);
    scope.done();
}));
it('should retry if the initial request fails', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}`)
        .times(2)
        .reply(500)
        .get(`${PATH}/${TYPE}`)
        .reply(200, {}, HEADERS);
    yield gcp.instance();
    scope.done();
}));
it('should throw if request options are passed', () => __awaiter(this, void 0, void 0, function* () {
    yield assertRejects(
    // tslint:disable-next-line no-any
    gcp.instance({ qs: { one: 'two' } }), /\'qs\' is not a valid configuration option. Please use \'params\' instead\./);
}));
it('should throw if invalid options are passed', () => __awaiter(this, void 0, void 0, function* () {
    yield assertRejects(
    // tslint:disable-next-line no-any
    gcp.instance({ fake: 'news' }), /\'fake\' is not a valid/);
}));
it('should retry on DNS errors', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}`)
        .replyWithError({ code: 'ETIMEDOUT' })
        .get(`${PATH}/${TYPE}`)
        .reply(200, {}, HEADERS);
    const data = yield gcp.instance();
    scope.done();
    assert(data);
}));
it('should report isGCE if the server returns a 500 first', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST)
        .get(`${PATH}/${TYPE}`)
        .twice()
        .reply(500)
        .get(`${PATH}/${TYPE}`)
        .reply(200, {}, HEADERS);
    const isGCE = yield gcp.isAvailable();
    scope.done();
    assert.equal(isGCE, true);
}));
it('should fail fast on isAvailable if ENOTFOUND is returned', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).replyWithError({ code: 'ENOTFOUND' });
    const isGCE = yield gcp.isAvailable();
    scope.done();
    assert.equal(false, isGCE);
}));
it('should fail fast on isAvailable if ENOENT is returned', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).replyWithError({ code: 'ENOENT' });
    const isGCE = yield gcp.isAvailable();
    scope.done();
    assert.equal(false, isGCE);
}));
it('should throw on unexpected errors', () => __awaiter(this, void 0, void 0, function* () {
    const scope = nock(HOST).get(`${PATH}/${TYPE}`).replyWithError({ code: '🤡' });
    yield assertRejects(gcp.isAvailable());
    scope.done();
}));
//# sourceMappingURL=index.test.js.map