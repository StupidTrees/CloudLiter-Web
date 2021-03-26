const express = require('express');
const router = express.Router();
const fs = require('fs')
const config = require("../config");
const jsonUtils = require("../utils/jsonUtils");
const {codes} = require("../utils/codes");
const formidable = require("formidable");

const service = require('../service/groupchatService')

router.post('/groupchat/create', function (req, res) {
    service.createChat(req.query.authId,req.body.name,req.body.list).then(value => {
        res.send(value)
    }, error => {
        res.send(error)
    })
})
