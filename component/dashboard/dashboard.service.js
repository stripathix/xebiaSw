/*jslint browser:true*/
/*global angular, d3*/
(function () {
    "use strict";
    function dashboardService($q, httpService, AppConst) {
        var content = {};
        function getPlanetsApi(searchparam) {
            return AppConst.planets + AppConst.search + searchparam;
        }
        function processPlanets(planets) {
            var color = d3.scaleOrdinal(d3.schemeCategory10);
            angular.forEach(planets, function (planet, key) {
                planet.gravity = parseInt(planet.gravity);
                planet.period = 1 / (parseInt(planet.rotation_period) || 24);
                planet.tilt = Math.floor(Math.random() * 180) + 1; //To make it look fancy add random tilt degree
                planet.key = planet.name.replace(" ", "");
                planet.colours = [color(key), color(key)];
                planet.radius = (parseInt(planet.diameter) || 10000) / 2;
            });
            return planets;
        }
        content.getPlanets = function (url) {
            var deferred = $q.defer();
            httpService.http_get(getPlanetsApi(url)).then(function (res) {
                deferred.resolve(processPlanets(res.results));
                return deferred.promise;
            }, function () {
                deferred.reject({status: false});
            });
            return deferred.promise;
        };
        return content;
    }
    angular.module("xebiaSwApp").service("dashboardService", ["$q", "httpService", "AppConst", dashboardService]);
}());
