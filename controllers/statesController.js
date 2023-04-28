const states = require('../model/states');
const data = {
    states: require('../model/statesData.json'),
    setData(data) { this.states = data }
}
async function buildFunFacts() {
    for (const state in data.states) {
        const findState = await states.findOne({ statecode: data.states[state].code }).exec();
        if (findState) {
            data.states[state].funfacts = findState.funfacts;
        }
    }
}
const getAllStates = async (req, res) => {
    if (req.query.contig) {
        const getAll = req.query.contig == 'false' ?
            data.states.filter(state => state.code != "HI" || state.code != "AK") :
            data.states.filter(state => state.code != "HI" && state.code != "AK");
        res.json(getAll);
        return;
    }
    res.json(data.states);
}
const getState = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    }
    res.json(findState);
}
const getFunFact = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    } else if (findState.funfacts) {
        res.status(201).json({ 'funfact': findState.funfacts[Math.floor((Math.random() * findState.funfacts.length))] });
    } else {
        res.status(201).json({ 'message': 'Funfact does not exist for queried state.' });
    }
}
const createFunFact = async (req, res) => {
    const { state } = req.params;
    const { funfacts } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ 'message': 'State abbreviation does not exist' });
    }
    if (!funfacts) {
        return res.status(400).json({ 'message': 'Funfact for state is required.' });
    }
    if (!Array.isArray(funfacts)) {
        return res.status(400).json({ 'message': 'Funfact must by of type array.' });
    }
    try {
        if (!await states.findOneAndUpdate({ statecode: stateCode }, { $push: { 'funfacts': req.body.funfacts } })) {
            await states.create({
                statecode: stateCode,
                funfacts: req.body.funfacts
            });
        }
        const oneState = await states.findOne({ statecode: stateCode }).exec();
        buildFunFacts();
        res.status(201).json(oneState);
    } catch (err) {
        console.error(err);
    }
}
const updateFunFact = async (req, res) => {
    const { state } = req.params;
    const { index, funfacts } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ 'message': 'State abbreviation does not exist' });
    }
    if (!funfacts || !Array.isArray(funfacts)) {
        return res.status(400).json({ 'message': 'Funfact for state is required and must be an array.' });
    }
    const oneState = await states.findOne({ statecode: stateCode }).exec();
    const findState = data.states.find(state => state.code == stateCode);
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
    res.status(201).json(update);
}
const deleteFunFact = async (req, res) => {
    const { state } = req.params;
    const { index } = req.body;
    const stateCode = state.toUpperCase();
    if (!state) {
        return res.status(400).json({ 'message': 'State abbreviation does not exist' });
    }
    if (!index) {
        return res.status(400).json({ 'message': 'Index for state is required.' });
    }
    const oneState = await states.findOne({ statecode: stateCode }).exec();
    const findState = data.states.find(state => state.code == stateCode);
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
    res.status(201).json(update);
}
const getCapital = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    }
    res.join({ "state": findState.state, "capital": findState.capital_city });
}
const getNickname = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    }
    res.join({ "state": findState.state, "nickname": findState.nickname });
}
const getPopulation = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    }
    res.join({ "state": findState.state, "population": findState.population });
}
const getAdmission = (req, res) => {
    const stateCode = req.params.state.toUpperCase();
    const findState = data.states.find(state => state.code == stateCode);
    if (!findState) {
        return res.status(404).json({ 'message': 'State code does not exist.' });
    }
    res.join({ "state": findState.state, "admission date": findState.admission_date });
}

module.exports = {
    getAllStates,
    getState,
    createFunFact,
    updateFunFact,
    deleteFunFact,
    getFunFact,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission
}