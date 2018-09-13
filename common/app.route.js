/*jslint browser: true*/
/*global angular*/
(function () {
    "use strict";
    angular.module("xebiaSwApp").config(["$stateProvider", "$urlRouterProvider",
            function ($stateProvider, $urlRouterProvider) {
        // default route
        $urlRouterProvider.otherwise("/dashboard");
        $stateProvider
            .state("dashboard", {
                url: "/dashboard",
                views: {
                    content: {
                        templateUrl: "xebiaSw/component/dashboard/dashboard.html"
                    }
                }
            })
            .state("login", {
                url: "/login",
                views: {
                    "content": {
                        templateUrl: "xebiaSw/component/login/login.html"
                    }
                }
            });
    }]);
    angular.module("xebiaSwApp").run(["$rootScope", "loginService", "$state",
            function ($rootScope, loginService, $state) {
        var loginRequired = ["dashboard"];
        $rootScope.$on("$stateChangeStart", function (event, toState) {
            if (loginRequired.indexOf(toState.name) > -1) {
                var user = loginService.isUserLoggedIn();
                if (!user) {
                    event.preventDefault();
                    $state.go("login");
                }
            }
        });
    }]);
}());
