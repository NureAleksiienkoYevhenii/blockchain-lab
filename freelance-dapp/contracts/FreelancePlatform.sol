// contracts/FreelancePlatform.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FreelancePlatform {
    
    // Структура проекту
    struct Project {
        uint256 id;
        address client;
        address freelancer;
        uint256 amount;
        string description;
        bool isCompleted; // Фрілансер здал роботу
        bool isPaid;      // Клієнт виплатив гроші
        bool exists;
    }

    uint256 public projectCount = 0;
    mapping(uint256 => Project) public projects;

    // Події для оновлення фронтенду (і запису в MongoDB пізніше)
    event ProjectCreated(uint256 id, address client, address freelancer, uint256 amount, string description);
    event WorkCompleted(uint256 id);
    event PaymentReleased(uint256 id, uint256 amount);

    // 1. Створення проекту (Клієнт платить ETH відразу в Escrow)
    function createProject(address _freelancer, string memory _description) external payable {
        require(msg.value > 0, "Price must be greater than 0");
        require(_freelancer != address(0), "Invalid freelancer address");

        projectCount++;
        projects[projectCount] = Project(
            projectCount,
            msg.sender,
            _freelancer,
            msg.value,
            _description,
            false,
            false,
            true
        );

        emit ProjectCreated(projectCount, msg.sender, _freelancer, msg.value, _description);
    }

    // 2. Фрілансер відмічає, що робота зроблена
    function markCompleted(uint256 _id) external {
        Project storage project = projects[_id];
        require(project.exists, "Project does not exist");
        require(msg.sender == project.freelancer, "Only freelancer can complete");
        require(!project.isCompleted, "Already completed");

        project.isCompleted = true;
        emit WorkCompleted(_id);
    }

    // 3. Клієнт підтверджує і гроші йдуть фрілансеру
    function releaseFunds(uint256 _id) external {
        Project storage project = projects[_id];
        require(project.exists, "Project does not exist");
        require(msg.sender == project.client, "Only client can release funds");
        require(project.isCompleted, "Work not completed yet");
        require(!project.isPaid, "Already paid");

        project.isPaid = true;
        
        // Переказ коштів фрілансеру
        (bool success, ) = payable(project.freelancer).call{value: project.amount}("");
        require(success, "Transfer failed");

        emit PaymentReleased(_id, project.amount);
    }
    
    // Отримати деталі проекту
    function getProject(uint256 _id) external view returns (Project memory) {
        return projects[_id];
    }
}