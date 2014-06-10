/**
 * Function makes a node
 * @param that
 * @param name
 * @param d
 * @returns {{type: *, name: *, nodeValue: *}}
 * @constructor
 */
function createNode(that, name, d) {
    that.name = name;
    that.nodeValue = d;
}

function FromNode(name, d) {
    createNode(this, name, d);
}

function ToNode(name, d) {
    createNode(this, name, d);
}

module.exports = {
    FromNode : FromNode,
    ToNode : ToNode
};
