const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');

router.route('/')
    .get(statesController.getAllStates)

router.route('/:state')
    .get(statesController.getState)

router.route('/:state/funfact')
    .post(statesController.createFunFact)
    .patch(statesController.updateFunFact)
    .delete(statesController.deleteFunFact);

router.route('/:state/:param')
    .get(statesController.getStateProperties);

module.exports = router;