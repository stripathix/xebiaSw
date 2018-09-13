/*jslint browser: true*/
/*global angular*/
(function () {
    "use strict";
    var httpService = function ($q, $http, AppConst) {
        var contents = {};
        contents.http_get = function (url) {
            var deferred = $q.defer();
            $http.get(AppConst.baseResource + url, {
                timeout: AppConst.httpRequestTimeouts
            }).then(function (response) {
                if (response) {
                    deferred.resolve(response.data);
                } else {
                    deferred.resolve(null);
                }
                return deferred.promise;
            }, function () {
                deferred.reject(null);
            });
            return deferred.promise;
        };
        contents.http_post = function (url, requestdata) {
            var deferred = $q.defer();
            $http.post(url, requestdata, {
                headers: {
                    "Content-Type": "application/json"
                },
                timeout: AppConst.httpRequestTimeouts
            }).then(function successCallback(response) {
                deferred.resolve(response);
                return deferred.promise;
            });
            return deferred.promise;

        };
        return contents;
    };
    angular.module("xebiaSwApp").service("httpService", ["$q", "$http", "AppConst", httpService]);
}());
