const states = require("../model/States");
const path = require("path");
const data = {
    stateData: require("../model/statesData.json"),
    setData: function (data) { this.stateData = data }
}
async function buildFunFacts() {
    const retrieveStates = data.stateData;
    for (const state in retrieveStates) {
        const findState = await states.findOne({ stateCode: retrieveStates[state].code }).exec();
        if (findState) {
            retrieveStates[state].funfacts = findState.funfacts;
        }
    }
}
buildFunFacts();
const getAllStates = async (req, res) => {
    const findState = data.stateData;
    if (req.query.contig) {
        const getAll = req.query.contig == "false" ?
            data.stateData.filter(state => state.code != "HI" || state.code != "AK") :
            data.stateData.filter(state => state.code != "HI" && state.code != "AK");
        res.status(200).json(getAll);
        return;
    }
    res.status(200).json(findState);
}
const getState = async (req, res) => {
    const { state } = req.params;
    const stateCode = state.toUpperCase();
    const findState = data.stateData.find(state => state.code == stateCode);
    const fact = await states.findOne({ stateCode: stateCode }, "funfacts").exec();
    if (!findState) {
        return res.status(404).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (fact) {
        findState.funfacts = [];
        findState.funfacts = findState.funfacts.concat(fact.funfacts);
    }
    res.status(200).json(findState);
}
const getStateProperties = async (req, res) => {
    const { state, param } = req.params;
    const stateCode = state.toUpperCase();
    const findState = data.stateData.find(state => state.code == stateCode);
    const fact = await states.findOne({ stateCode: stateCode }, "funfacts").exec();
    const empty = param;
    if (!findState) {
        return res.status(404).json({ "message": "Invalid state abbreviation parameter" });
    }
    switch (empty) {
        case "capital":
            return res.status(200).json({ "state": findState.state, "capital": findState.capital_city });
            break;
        case "nickname":
            return res.status(200).json({ "state": findState.state, "nickname": findState.nickname });
            break;
        case "population":
            return res.status(200).json({ "state": findState.state, "population": findState.population.toLocaleString("en-US") });
            break;
        case "admission":
            return res.status(200).json({ "state": findState.state, "admission": findState.admission_date });
            break;
        case "funfact":
            if (fact) {
                return res.status(200).json({ "funfact": fact.funfacts[Math.floor(Math.random() * fact.funfacts.length)] });
            } else {
                return res.status(404).json({ "message": `No Fun Facts found for ${findState.state}` });
            }
            break;
        default:
            res.status(404);
            if (req.accepts("html")) {
                res.sendFile(path.join(__dirname, "..", "views", "404.html"));
            }
    }
}
const createFunFact = async (req, res) => {
    const { state } = req.params;
    const { funfacts } = req.body;
    if (!req?.params?.state) {
        return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (!req?.body?.funfacts) {
        return res.status(400).json({ "message": "State fun fact value is required." });
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ "message": "State fun fact value must an array." });
    }
    const stateCode = state.toUpperCase();
    try {
        if (!await states.findOneAndUpdate({ stateCode: stateCode }, { $push: { "funfacts": funfacts } })) {
            await states.create({
                stateCode: stateCode,
                funfacts: funfacts
            });
        }
        const oneState = await states.findOne({ stateCode: stateCode }).exec();
        res.status(200).json(oneState);
    } catch (err) {
        console.error(err);
    }
    buildFunFacts();
}
const updateFunFact = async (req, res) => {
    const { state } = req.params;
    const { index, funfacts } = req.body;
    if (!req?.params?.state) {
        return res.status(400).json({ "message": "Invalid state abbreviation parameter" });
    }
    if (!req?.body?.index) {
        return res.status(400).json({ "message": "State fun fact index value required" });
    }
    if (!req?.body?.funfacts) {
        return res.status(400).json({ "message": "State fun fact value required" });
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ "message": "State fun fact value must be an array" });
    }
    const stateCode = state.toUpperCase();
    const oneState = await states.findOne({ stateCode: stateCode }).exec();
    const findState = data.stateData.find(state => state.code == stateCode);
    let stateIndex = index;
    if (!findState.funfacts || stateIndex - 1 == 0) {
        return res.status(400).json({ "message": `No Fun Facts found for ${findState.state}` });
    }
    if (!stateIndex || stateIndex > oneState.funfacts.length || stateIndex < 1) {
        const oneState = data.stateData.find(state => state.code == stateCode);
        return res.status(400).json({ "message": `No Fun Facts found for ${findState.state}` });
    }
    stateIndex -= 1;

    if (funfacts) {
        oneState.funfacts[stateIndex] = funfacts[0];
    }
    const update = await oneState.save();
    buildFunFacts();
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
        return res.status(400).json({ "message": "State fun fact index value required" });
    }
    const oneState = await states.findOne({ stateCode: stateCode }).exec();
    const findState = data.stateData.find(state => state.code == stateCode);
    let stateIndex = index;
    if (!findState.funfacts || stateIndex - 1 == 0) {
        return res.status(400).json({ "message": `No Fun Facts found for ${findState.state}` });
    }
    if (!stateIndex || stateIndex > oneState.funfacts.length || stateIndex < 1) {
        const oneState = findState;
        return res.status(400).json({ "message": `No Fun Facts found at the index for ${findState.state}` });
    }
    stateIndex -= 1;
    oneState.funfacts.splice(stateIndex, 1);
    const update = await oneState.save();
    res.status(200).json(update);
    buildFunFacts();
}

module.exports = {
    getAllStates,
    getState,
    getStateProperties,
    createFunFact,
    updateFunFact,
    deleteFunFact,
}