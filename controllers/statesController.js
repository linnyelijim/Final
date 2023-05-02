const states = require("../model/States");                  //pulls States.js file
const path = require("path");                               //allows directory paths
const data = {                                              //sets json data to data variable
    stateData: require("../model/statesData.json"),         //pulls json file of states data
    setData: function (data) { this.stateData = data }      //sets the states data
}

async function buildFunFacts() {                                                 //merges json data with db funfacts
    const stateCodes = data.stateData.map((state) => state.code);                //creates array of state code
    for (let i = 0; i < stateCodes.length; i++) {                                //loops through each state code
        const code = stateCodes[i];                                              //sets current stateCode to code
        const findState = await states.findOne({ stateCode: code }).exec();      //searches database for code, assigns to find state
        if (findState) {                                                         //if exists, update funfacts of state
            data.stateData[i].funfacts = findState?.funfacts;
        }
    }
}
buildFunFacts(); //merges mongodb and json data

const getAllStates = async (req, res) => {          //retrieves all states
    const findState = data.stateData;               //sets states to findState
    if (req.query) {                                //if query exists--
        if (req.query.contig) {                     //if contig param exists--
            const getAll =                          //sets filtered states to getAll based on true/ false
                req.query.contig == 'false'         //removes all except hawaii and alaska
                    ? data.stateData.filter(state => state.code == "HI" || state.code == "AK")
                    : req.query.contig == 'true'    //removes only hawaii and alaska
                        ? data.stateData.filter(state => state.code != "HI" && state.code != "AK")
                        : res.status(404);          //default
            res.json(getAll);                       //output result of ternary
            return;
        }
    }
    res.status(200).json(findState);                //output all states if no contig exist
}

const getState = async (req, res) => {                                                  //retrieves single state
    const { state } = req.params;                                                       //destructures state parameter
    const stateCode = state.toUpperCase();                                              //converts state code to capital letters
    const findState = data.stateData.find(state => state.code == stateCode);            //sets requested state to findState
    const fact = await states.findOne({ stateCode: stateCode }, "funfacts").exec();     //sets associated state funfact to fact

    !findState ? res.status(404).json({ "message": "Invalid state abbreviation parameter" }) :                                              //if state doesn't exist, message = ".."
        fact ? (findState.funfacts = [], findState.funfacts = findState.funfacts.concat(fact.funfacts), res.status(200).json(findState)) :  //if fact exists, join funfact array to state and output findState
            res.status(200).json(findState);                                                                                                //else, output findState
}

const getStateProperties = async (req, res) => {                                        //retrieves each of the state properties on request
    const { state, param } = req.params;                                                //destructures state and place filler 'param' parameters
    const stateCode = state.toUpperCase();                                              //converts state code to capital letters
    const findState = data.stateData.find(state => state.code == stateCode);            //sets requested state to findState
    const fact = await states.findOne({ stateCode: stateCode }, "funfacts").exec();     //sets associated state funfact to fact
    if (!findState) {                                                                   //if state doesn't exist, ouput message
        return res.status(404).json({ "message": "Invalid state abbreviation parameter" });
    }
    switch (param) {                                                                    //evaluates each potential state property request
        case "capital":                                                                 //for capital, return requested state and capital
            return res.status(200).json({ "state": findState.state, "capital": findState.capital_city });
            break;
        case "nickname":                                                                //for nickname, return requested state and nickname
            return res.status(200).json({ "state": findState.state, "nickname": findState.nickname });
            break;
        case "population":                                                              //for population, return requested state and population
            return res.status(200).json({ "state": findState.state, "population": findState.population.toLocaleString("en-US") });
            break;
        case "admission":                                                               //for admitted, return requested state and admission date
            return res.status(200).json({ "state": findState.state, "admitted": findState.admission_date });
            break;
        case "funfact":
            if (fact) {                                                                 //for funfact, return random funfact associated with requested state
                return res.status(200).json({ "funfact": fact.funfacts[Math.floor(Math.random() * fact.funfacts.length)] });
            } else {                                                                    //message if no funfact exists
                return res.status(404).json({ "message": `No Fun Facts found for ${findState.state}` });
            }
            break;
        default:                                                                        //if request is made for non-existant parameter output 404 html page
            res.status(404);
            if (req.accepts("html")) {
                res.sendFile(path.join(__dirname, "..", "views", "404.html"));
            }
    }
}
const createFunFact = async (req, res) => {     //creates new funfact for state, creating a new array if needed
    const { state } = req.params;               //destructures state parameters
    const { funfacts } = req.body;              //destructures funfacts parameters
    const stateCode = state.toUpperCase();      //converts state code to capital letters

    const message = !state ? "Invalid state abbreviation parameter" :               //if state doesn't exist, message = ".."
        !funfacts ? "State fun facts value required" :                              //if funfacts doesn't exist, message = ".."
            !Array.isArray(funfacts) ? "State fun facts value must be an array" :   //if funfacts isn't an array, message = ".."
                null;                                                               //else, null
    if (message != null) {                      //if not null, return message
        return res.status(400).json({ "message": message });
    }

    try {                                      //if requested state doesn't have funfact array, create one, add funfact
        if (!await states.findOneAndUpdate({ stateCode: stateCode }, { $push: { "funfacts": funfacts } })) {
            await states.create({
                stateCode: stateCode,
                funfacts: funfacts
            });
        }
        const oneState = await states.findOne({ stateCode: stateCode }).exec();     //if funfacts exists, add funfact
        res.status(200).json(oneState);                                             //sends oneState as json object
    } catch (err) {
        console.error(err);                                                         //if error, log
    }
    buildFunFacts();                                                                //rebuilds funfacts
}
const updateFunFact = async (req, res) => {                                     //updates existing funfact(s)
    const { state } = req.params;                                               //destructures state parameter
    const { index, funfact } = req.body;                                        //destructures index and funfact parameter
    const stateCode = state.toUpperCase();                                      //converts state code to capital letters
    const oneState = await states.findOne({ stateCode: stateCode }).exec();     //sets requested states funfact from MongoDB to oneState
    const findState = data.stateData.find(state => state.code == stateCode);    //sets requested state to findState
    let stateIndex = index;                                                     //sets specified index to stateIndex

    const message = !state ? "Invalid state abbreviation parameter" :                       //if state doesn't exist, message = ".."
        !index ? "State fun fact index value required" :                                    //if index doesn't exist, message = ".."
            !funfact ? "State fun fact value required" :                                    //if funfact doesn't exist, message = ".."
                !findState || !findState.funfacts || stateIndex <= 0
                    ? `No Fun Facts found for ${findState.state}` :                         //if findState doesn't exist, dosen't have funfacts, or index <= 0, message = ".."
                    !stateIndex || stateIndex > oneState.funfacts.length || stateIndex < 1
                        ? `No Fun Fact found at that index for ${findState.state}` :        //if index doesn't exist, index is larger than funfact array, or index < 1, message = ".."
                        null;                                                               //else, null
    if (message != null) {                      //if not null, return message
        return res.status(400).json({ "message": message });
    }
    stateIndex -= 1;                            //decrement index so 0
    if (funfact) {                              //if funfact exists, update specified index
        oneState.funfacts[stateIndex] = funfact;
    }

    const update = await oneState.save();       //saves updated oneState
    buildFunFacts();                            //rebuilds funfacts
    res.status(200).json(update);               //sends updated oneState as json object
}

const deleteFunFact = async (req, res) => {     //deletes existing funfact for state
    const { state } = req.params;               //deconstructs state parameter
    const { index } = req.body;                 //deconstructs index parameter
    const stateCode = state.toUpperCase();      //converts state code to capital letters
    const oneState = await states.findOne({ stateCode: stateCode }).exec();     //sets requested states funfact from MongoDB to oneState
    const findState = data.stateData.find(state => state.code == stateCode);    //sets requested state to findState
    let stateIndex = index;                     //sets specified index to stateIndex

    const message = !state ? "Invalid state abbreviation parameter" :                       //if state doesn't exist, message = ".."
        !index ? "State fun fact index value required" :                                    //if index doesn't exist, message = ".."
            !oneState || !oneState.funfacts || stateIndex <= 0
                ? `No Fun Facts found for ${findState.state}` :                             //if oneState doesn't exist, doesn't have funfacts, or index <= 0, message = ".."
                !stateIndex || stateIndex > findState.funfacts.length || stateIndex < 1
                    ? `No Fun Fact found at that index for ${findState.state}` :            //if index doesn't exist, index is larger than funfact array, or index < 1, message = ".."
                    null;                                                                   //else, null
    if (message != null) {                      //if not null, return message
        return res.status(400).json({ "message": message });
    }

    stateIndex -= 1;                            //decrement index so 0
    oneState.funfacts.splice(stateIndex, 1);    //removes specified funfact by index
    const update = await oneState.save();       //saves updated oneState
    buildFunFacts();                            //rebuilds funfacts
    res.status(200).json(update);               //sends updated oneState as json object
}

module.exports = {
    getAllStates,
    getState,
    getStateProperties,
    createFunFact,
    updateFunFact,
    deleteFunFact
}