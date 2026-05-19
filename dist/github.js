"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPRFiles = getPRFiles;
exports.postComment = postComment;
function getPRFiles(octokit, owner, repo, pullNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const files = [];
        const iterator = octokit.paginate.iterator(octokit.rest.pulls.listFiles, { owner, repo, pull_number: pullNumber, per_page: 100 });
        try {
            for (var _d = true, iterator_1 = __asyncValues(iterator), iterator_1_1; iterator_1_1 = yield iterator_1.next(), _a = iterator_1_1.done, !_a; _d = true) {
                _c = iterator_1_1.value;
                _d = false;
                const { data } = _c;
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
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = iterator_1.return)) yield _b.call(iterator_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return files;
    });
}
function postComment(octokit, owner, repo, pullNumber, body) {
    return __awaiter(this, void 0, void 0, function* () {
        yield octokit.rest.issues.createComment({
            owner,
            repo,
            issue_number: pullNumber,
            body,
        });
    });
}
