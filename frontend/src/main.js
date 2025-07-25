"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./style.css");
var router_1 = require("./router/router");
var LoginPage_1 = require("./pages/LoginPage");
var HomePage_1 = require("./pages/HomePage");
var GamePage_1 = require("./pages/GamePage");
var ProfilePage_1 = require("./pages/ProfilePage");
var ChatPage_1 = require("./pages/ChatPage");
var NotFoundPage_1 = require("./pages/NotFoundPage");
var SignUpPage_1 = require("./pages/SignUpPage");
router_1.router
    .addRoute('/', LoginPage_1.createLoginPage)
    .addRoute('/login', LoginPage_1.createLoginPage)
    .addRoute('/signup', SignUpPage_1.createSignUpPage)
    .addRoute('/home', HomePage_1.createHomePage)
    .addRoute('/game', GamePage_1.createGamePage)
    .addRoute('/profile', ProfilePage_1.createProfilePage)
    .addRoute('/chat', ChatPage_1.createChatPage)
    .addRoute('/404', NotFoundPage_1.createNotFoundPage);
router_1.router.start();
