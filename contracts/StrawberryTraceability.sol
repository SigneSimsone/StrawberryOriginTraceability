// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract StrawberryTraceability {

    struct Event {
        string participant;
        string eventType;
        string date;
        uint256 timestamp;
    }

    struct Product {
        string name;
        string origin;
        string producer;
        Event[] history;
    }

    mapping(string => Product) private products;

    event ProductCreated(string productId, string producer);
    event ProductUpdated(string productId, string participant, string eventType);

    // Create a new product
    function createProduct(
        string memory productId,
        string memory name,
        string memory origin,
        string memory date,
        string memory producer
    ) public {
        Product storage p = products[productId];
        p.name = name;
        p.origin = origin;
        p.producer = producer;
        p.history.push(Event(producer, "Harvested, Washed & Packaged", date, block.timestamp));
        emit ProductCreated(productId, producer);
    }

    // Update product status
    function updateProduct(
        string memory productId,
        string memory participant,
        string memory eventType,
        string memory date
    ) public {
        Product storage p = products[productId];
        p.history.push(Event(participant, eventType, date, block.timestamp));
        emit ProductUpdated(productId, participant, eventType);
    }

    // Get history (for consumer view)
    function getHistory(string memory productId) public view returns (Event[] memory) {
        return products[productId].history;
    }

    // Get producer info
    function getProducer(string memory productId) public view returns (string memory) {
        return products[productId].producer;
    }
}