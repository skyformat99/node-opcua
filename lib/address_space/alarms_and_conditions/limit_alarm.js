"use strict";
/**
 * @module opcua.address_space.AlarmsAndConditions
 */
require("requirish")._(module);

var util = require("util");
var assert = require("assert");
var _ = require("underscore");

var StatusCodes = require("lib/datamodel/opcua_status_code").StatusCodes;
var DataType = require("lib/datamodel/variant").DataType;


var UAAlarmConditionBase = require("./alarm_condition").UAAlarmConditionBase;

var UAVariable = require("lib/address_space/ua_variable").UAVariable;
/**
 * @class UALimitAlarm
 * @constructor
 * @extends UAAlarmConditionBase
 */
function UALimitAlarm() {
    /**
     * @property activeState {TwoStateVariable}
     */

}
util.inherits(UALimitAlarm, UAAlarmConditionBase);

/**
 * @method getHighHighLimit
 * @return {Float}
 */
UALimitAlarm.prototype.getHighHighLimit = function () {
    return this.highHighLimit.readValue().value.value;
};

/**
 * @method getHighLimit
 * @return {Float}
 */
UALimitAlarm.prototype.getHighLimit = function () {
    return this.highLimit.readValue().value.value;
};

/**
 * @method getLowLimit
 * @return {Float}
 */
UALimitAlarm.prototype.getLowLimit = function () {
    return this.lowLimit.readValue().value.value;
};

/**
 * @method getLowLowLimit
 * @return {Float}
 */
UALimitAlarm.prototype.getLowLowLimit = function () {
    return this.lowLowLimit.readValue().value.value;
};

/**
 * @method setHighHighLimit
 * @param value {Float}
 */
UALimitAlarm.prototype.setHighHighLimit = function (value) {
    assert(this.highHighLimit, "LimitAlarm instance must expose the optional HighHighLimit property");
    this.highHighLimit.setValueFromSource({dataType: this._dataType, value: value});

};

/**
 * @method setHighLimit
 * @param value {Float}
 */
UALimitAlarm.prototype.setHighLimit = function (value) {
    assert(this.highLimit, "LimitAlarm instance must expose the optional HighLimit property");
    this.highLimit.setValueFromSource({dataType: this._dataType, value: value});
};

/**
 * @method setLowLimit
 * @param value {Float}
 */
UALimitAlarm.prototype.setLowLimit = function (value) {
    assert(this.lowLimit, "LimitAlarm instance must expose the optional LowLimit property");
    this.lowLimit.setValueFromSource({dataType: this._dataType, value: value});

};

/**
 * @method setLowLowLimit
 * @param value {Float}
 */
UALimitAlarm.prototype.setLowLowLimit = function (value) {
    assert(this.lowLowLimit, "LimitAlarm instance must expose the optional LowLowLimit property");
    this.lowLowLimit.setValueFromSource({dataType: this._dataType, value: value});
};

UALimitAlarm.prototype._onInputDataValueChange = function (dataValue) {

    if (dataValue.statusCode !== StatusCodes.Good) {
        // what shall we do ?
        return;
    }
    if (dataValue.value.dataType === DataType.Null) {
        // what shall we do ?
        return;
    }
    assert(_.isFinite(dataValue.value.value));
    var value = dataValue.value;

    assert(false, "must be overriden");
};


exports.UALimitAlarm = UALimitAlarm;

/**
 * @method (static)UALimitAlarm.instantiate
 * @param addressSpace {AddressSpace}
 * @param limitAlarmTypeId
 * @param options
 * @param options.inputNode
 * @param options.optionals
 * @param options.highHighLimit {Double}
 * @param options.highLimit     {Double}
 * @param options.lowLimit      {Double}
 * @param options.lowLowLimit   {Double}
 * @param data
 * @return {UALimitAlarm}
 */
UALimitAlarm.instantiate = function (addressSpace, limitAlarmTypeId, options, data) {

    // must provide a inputNode
    //xx assert(options.hasOwnProperty("conditionOf")); // must provide a conditionOf
    assert(options.hasOwnProperty("inputNode"), "UALimitAlarm.instantiate: options must provide the inputNode");

    options.optionals = options.optionals || [];
    var count = 0;
    if (options.hasOwnProperty("highHighLimit")) {
        options.optionals.push("HighHighLimit");
        options.optionals.push("HighHighState");
        count++;
    }
    if (options.hasOwnProperty("highLimit")) {
        options.optionals.push("HighLimit");
        options.optionals.push("HighState");
        count++;
    }
    if (options.hasOwnProperty("lowLimit")) {
        options.optionals.push("LowLimit");
        options.optionals.push("LowState");
        count++;
    }
    if (options.hasOwnProperty("lowLowLimit")) {
        options.optionals.push("LowLowLimit");
        options.optionals.push("LowLowState");
        count++;
    }

    //xx assert(options.optionals,"must provide an optionals");
    var alarmNode = UAAlarmConditionBase.instantiate(addressSpace, limitAlarmTypeId, options, data);
    Object.setPrototypeOf(alarmNode, UALimitAlarm.prototype);

    assert(alarmNode.conditionOfNode() != null);

    var inputNode = addressSpace._coerceNode(options.inputNode);
    assert(inputNode, "Expecting a valid input node");
    assert(inputNode instanceof UAVariable);

    // ----------------------- Install Limit Alarm specifics
    // from spec 1.03:
    // Four optional limits are defined that configure the states of the derived limit Alarm Types.
    // These Properties shall be set for any Alarm limits that are exposed by the derived limit Alarm
    // Types. These Properties are listed as optional but at least one is required. For cases where
    // an underlying system cannot provide the actual value of a limit, the limit Property shall still be
    // provided, but will have its AccessLevel set to not readable. It is assumed that the limits are
    // described using the same Engineering Unit that is assigned to the variable that is the source
    // of the alarm. For Rate of change limit alarms, it is assumed this rate is units per second
    // unless otherwise specified.
    if (count === 0) {
        throw new Error("at least one limit is required");
    }

    var dataType = addressSpace.findCorrespondingBasicDataType(options.inputNode.dataType);
    alarmNode._dataType = dataType;

    if (options.hasOwnProperty("highHighLimit")) {
        alarmNode.setHighHighLimit(options.highHighLimit);
    }
    if (options.hasOwnProperty("highLimit")) {
        alarmNode.setHighLimit(options.highLimit);
    }
    if (options.hasOwnProperty("lowLimit")) {
        alarmNode.setLowLimit(options.lowLimit);
    }
    if (options.hasOwnProperty("lowLowLimit")) {
        alarmNode.setLowLowLimit(options.lowLowLimit);
    }

    /**
     *
     *
     * The InputNode Property provides the NodeId of the Variable the Value of which is used as
     * primary input in the calculation of the Alarm state. If this Variable is not in the AddressSpace,
     * a Null NodeId shall be provided. In some systems, an Alarm may be calculated based on
     * multiple Variables Values; it is up to the system to determine which Variable’s NodeId is used.
     * @property inputNode
     * @type     UAVariable
     * dataType is DataType.NodeId
     */
    assert(inputNode instanceof UAVariable);
    alarmNode.inputNode.setValueFromSource({ dataType:"NodeId",value:inputNode.nodeId});

    // install inputNode monitoring for change
    inputNode.on("value_changed", function (newDataValue, oldDataValue) {
        alarmNode._onInputDataValueChange(newDataValue);
    });
    return alarmNode;
};
