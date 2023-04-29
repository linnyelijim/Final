const states = require("../model/States");
const path = require('path');
const data = {
    stateData: require('../model/statesData.json'),
    setData: function (data) { this.states = data }
}
async function buildFunFacts() {
    for (const state in data.stateData) {
        const findState = await states.findOne({ stateCode: data.stateData[state].code }).exec();
        if (findState) {
            data.stateData[state].funfacts = findState.funfacts;
        }
    }
}
const getAllStates = async (req, res) => {
    if (req.query.contig) {
        const getAll = req.query.contig == 'false' ?
            data.stateData.filter(state => state.code != "HI" || state.code != "AK") :
            data.stateData.filter(state => state.code != "HI" && state.code != "AK");
        res.json(getAll);
        return;
    }
    res.json(data.stateData);
}
const getState = (req, res) => {
    const { state } = req.params;
    const stateCode = state.toUpperCase();
    const findState = data.stateData.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ "message": "Invalid state abbreviation parameter" });
    }
    res.json(findState);
}
const getStateProperties = async (req, res) => {
    const { state, param } = req.params;
    const stateCode = state.toUpperCase();
    const findState = data.stateData.find(state => state.code == stateCode);
    const fact = await states.findOne({ stateCode: stateCode }, 'funfacts').exec();
    const empty = param;
    if (!findState) {
        return res.status(404).json({ "message": "Invalid state abbreviation parameter" });
    }
    switch (empty) {
        case 'capital':
            return res.status(200).json({ "state": findState.state, "capital": findState.capital_city });
            break;
        case 'nickname':
            return res.status(200).json({ "state": findState.state, "nickname": findState.nickname });
            break;
        case 'population':
            return res.status(200).json({ "state": findState.state, "population": findState.population });
            break;
        case 'admission':
            return res.status(200).json({ "state": findState.state, "admission": findState.admission_date });
            break;
        case 'funfact':
            if (fact) {
                return res.status(200).json({ "funfact": fact.funfacts[Math.floor(Math.random() * fact.funfacts.length)] });
            } else {
                return res.status(404).json({ "message": `No Fun Facts found for ${findState.state}` });
            }
            break;
        default:
            res.status(404);
            if (accepts('html')) {
                res.sendFile(path.join(__dirname, '..', 'views', '404.html'));
            }
    }
}
const createFunFact = async (req, res) => {
    const { state } = req.params;
    const { funfacts } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (!funfacts) {
        return res.status(400).json({ 'message': 'Funfact for state is required.' });
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ 'message': 'Funfact must by of type array.' });
    }
    try {
        if (!await states.findOneAndUpdate({ stateCode: stateCode }, { $push: { 'funfacts': funfacts } })) {
            await states.create({
                stateCode: stateCode,
                funfacts: req.body.funfacts
            });
        }
        const oneState = await states.findOne({ stateCode: stateCode }).exec();
        buildFunFacts();
        res.status(200).json(oneState);
    } catch (err) {
        console.error(err);
    }
}
const updateFunFact = async (req, res) => {
    const { state } = req.params;
    const { index, funfacts } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (!funfacts || !Array.isArray(funfacts)) {
        return res.status(400).json({ 'message': 'Funfact for state is required and must be an array.' });
    }
    const oneState = await states.findOne({ stateCode: stateCode }).exec();
    const findState = data.stateData.find(state => state.code == stateCode);
    let stateIndex = index;
    if (!findState?.funfacts || stateIndex - 1 == 0) {
        return res.status(400).json({ 'message': 'Funfact does not exist for queried state.' });
    }
    if (isNaN(stateIndex) || (stateIndex >= findState?.funfacts?.length ?? 0) || stateIndex < 0) {
        return res.status(400).json({ 'message': 'Funfact does not exist for queried index.' });
    }
    stateIndex -= 1;

    if (funfacts) {
        findState.funfacts[stateIndex] = funfacts[0];
    }
    const update = await oneState.save();
    res.status(200).json(update);
}
const deleteFunFact = async (req, res) => {
    const { state } = req.params;
    const { index } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (!index) {
        return res.status(400).json({ 'message': 'Index for state is required.' });
    }
    const oneState = await states.findOne({ stateCode: stateCode }).exec();
    const findState = data.stateData.find(state => state.code == stateCode);
    let stateIndex = index;
    if (!findState?.funfacts || stateIndex - 1 == 0) {
        return res.status(400).json({ 'message': 'Funfact does not exist for queried state.' });
    }
    if (isNaN(stateIndex) || (stateIndex >= findState?.funfacts?.length ?? 0) || stateIndex < 1) {
        return res.status(400).json({ 'message': 'Funfact does not exist for queried index.' });
    }
    stateIndex -= 1;
    oneState.funfacts.splice(stateIndex, 1);
    buildFunFacts();
    const update = await oneState.save();
    res.status(200).json(update);
}

module.exports = {
    getAllStates,
    getState,
    getStateProperties,
    createFunFact,
    updateFunFact,
    deleteFunFact,
}