/*jslint browser:true*/
/*global angular*/
(function () {
    "use strict";
    function MainController($state, loginService) {
        var MainCtrl = {};
        MainCtrl.logout = function () {
            loginService.logoutUser();
            MainCtrl.userObj = null;
            $state.go("login");
        };
        MainCtrl.loadUserObj = function () {
            MainCtrl.userObj = loginService.isUserLoggedIn();
        };
        MainCtrl.loadUserObj();
        return MainCtrl;
    }
    angular.module("xebiaSwApp").controller("MainController", ["$state", "loginService", MainController]);
}());
