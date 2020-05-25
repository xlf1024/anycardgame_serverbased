"use strict";
import {Controller} from "./Controller.js"

window.controller = new Controller((document.location.protocol === "https:" ? "wss://" : "ws://") + document.location.host, document.querySelector("svg.CardsContainer"));


