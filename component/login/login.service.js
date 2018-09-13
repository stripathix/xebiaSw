/*jslint browser:true*/
/*global angular, d3, btoa, atob*/
(function () {
    "use strict";
    function loginService($q, httpService, AppConst) {
        var content = {};
        content.userObj = null;
        function getLoginApi(username) {
            return AppConst.people + AppConst.search + username;
        }
        function saveUserToLs(user) {
            var userObj = {
                username: user.name,
                password: user.birth_year
            };
            localStorage.setItem(AppConst.localstorageUser, btoa(JSON.stringify(userObj)));
        }
        function getUserFromLs() {
            var user = localStorage.getItem(AppConst.localstorageUser);
            if (user) {
                user = JSON.parse(atob(user));
                content.userObj = user;
            }
            return user;
        }
        function isUserAuthenticated(res, password) {
            var userObj = {
                status: false
            };
            if (res.count > 0) {
                if (res.results[0].birth_year === password) {
                    userObj = res.results[0];
                    saveUserToLs(userObj);
                    content.userObj = userObj;
                }
            }
            return userObj;
        }
        content.authenticate = function (account) {
            var deferred = $q.defer();
            httpService.http_get(getLoginApi(account.username)).then(function (res) {
                deferred.resolve(isUserAuthenticated(res, account.password));
                return deferred.promise;
            }, function () {
                deferred.reject({status: false});
            });
            return deferred.promise;
        };
        content.logoutUser = function () {
            localStorage.removeItem(AppConst.localstorageUser);
        };
        content.isUserLoggedIn = function () {
            var user = getUserFromLs();
            return user;
        };
        return content;
    }
    angular.module("xebiaSwApp").service("loginService", ["$q", "httpService", "AppConst", loginService]);
}());
