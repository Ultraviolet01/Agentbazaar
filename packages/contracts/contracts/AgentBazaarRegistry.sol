// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentBazaarRegistry
 * @dev On-chain registry for AI agents participating in the AgentBazaar ecosystem.
 * This contract anchors agent metadata (stored on 0G Storage) to the 0G Network.
 */
contract AgentBazaarRegistry {
    struct Agent {
        address owner;
        string name;
        string metadataCid; // 0G Storage root hash (CID)
        uint256 createdAt;
        uint256 lastUpdatedAt;
        bool active;
    }

    uint256 public agentCount;
    mapping(uint256 => Agent) public agents;
    mapping(address => uint256[]) public ownerToAgents;

    event AgentRegistered(uint256 indexed agentId, address indexed owner, string name, string metadataCid);
    event MetadataUpdated(uint256 indexed agentId, string newMetadataCid);
    event AgentStatusChanged(uint256 indexed agentId, bool active);

    modifier onlyOwner(uint256 agentId) {
        require(agents[agentId].owner == msg.sender, "Not the agent owner");
        _;
    }

    /**
     * @dev Registers a new agent in the registry.
     * @param name The human-readable name of the agent.
     * @param metadataCid The 0G Storage CID containing agent definitions/models.
     */
    function registerAgent(string calldata name, string calldata metadataCid) external returns (uint256) {
        uint256 newAgentId = ++agentCount;
        
        agents[newAgentId] = Agent({
            owner: msg.sender,
            name: name,
            metadataCid: metadataCid,
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            active: true
        });

        ownerToAgents[msg.sender].push(newAgentId);

        emit AgentRegistered(newAgentId, msg.sender, name, metadataCid);
        return newAgentId;
    }

    /**
     * @dev Updates the metadata CID for an existing agent (e.g., after model retraining or run output).
     * @param agentId The unique ID of the agent.
     * @param newMetadataCid The new 0G Storage CID.
     */
    function updateMetadata(uint256 agentId, string calldata newMetadataCid) external onlyOwner(agentId) {
        agents[agentId].metadataCid = newMetadataCid;
        agents[agentId].lastUpdatedAt = block.timestamp;
        
        emit MetadataUpdated(agentId, newMetadataCid);
    }

    /**
     * @dev Toggles the active status of an agent.
     * @param agentId The unique ID of the agent.
     * @param active The new status.
     */
    function setAgentStatus(uint256 agentId, bool active) external onlyOwner(agentId) {
        agents[agentId].active = active;
        emit AgentStatusChanged(agentId, active);
    }

    /**
     * @dev Batch retrieval of agents owned by a specific address.
     */
    function getAgentsByOwner(address owner) external view returns (uint256[] memory) {
        return ownerToAgents[owner];
    }

    /**
     * @dev Internal helper to check if an agent exists.
     */
    function agentExists(uint256 agentId) external view returns (bool) {
        return agents[agentId].createdAt != 0;
    }
}
