// Domain content for the demo dataset.
//
// The spec calls for "departments" and "programs", which this schema has no
// tables for. A department is expressed as a group of modules plus the
// speciality code its classes carry, and a program is an AcademicLevel, so the
// demo maps onto the structure the app already renders instead of inventing
// tables the controllers would ignore.

// Four departments, each with the levels (programs) it teaches and the modules
// that belong to it. Module names are coherent per department so the seeded
// catalogue reads like a real curriculum.
const DEPARTMENTS = [
    {
        name: 'Computer Science',
        code: 'CS',
        speciality: 'IS',
        levels: [
            { name: 'CP1', type: 'ECOLE_SUPERIEURE', hasSpeciality: false },
            { name: 'CS1', type: 'ECOLE_SUPERIEURE', hasSpeciality: false },
            { name: 'CS2', type: 'ECOLE_SUPERIEURE', hasSpeciality: true },
        ],
        modules: [
            ['Algorithms and Complexity', 'Sorting, graph traversal, dynamic programming and complexity analysis.'],
            ['Databases', 'Relational modelling, normalization, SQL and transaction management.'],
            ['Operating Systems', 'Processes, scheduling, memory management, file systems and concurrency.'],
            ['Computer Networks', 'The TCP/IP stack, routing, addressing and application protocols.'],
            ['Software Engineering', 'Requirements, design patterns, testing strategy and version control.'],
            ['Web Development', 'HTTP, front-end frameworks, REST API design and client-server architecture.'],
            ['Machine Learning', 'Supervised and unsupervised learning, model evaluation and regularisation.'],
            ['Compilation Theory', 'Lexical analysis, parsing, semantic analysis and code generation.'],
            ['Distributed Systems', 'Consistency models, consensus, replication and fault tolerance.'],
            ['Computer Security', 'Cryptography, authentication, common vulnerabilities and secure design.'],
            ['Data Structures', 'Lists, trees, heaps, hash tables and their performance trade-offs.'],
            ['Artificial Intelligence', 'Search, knowledge representation, planning and reasoning under uncertainty.'],
            ['Mobile Development', 'Native and cross-platform applications, lifecycle and offline storage.'],
            ['Cloud Computing', 'Virtualisation, containers, orchestration and elastic service design.'],
            ['Human-Computer Interaction', 'Usability principles, prototyping, accessibility and user evaluation.'],
        ],
    },
    {
        name: 'Mathematics',
        code: 'MATH',
        speciality: 'MA',
        levels: [
            { name: 'CP2', type: 'ECOLE_SUPERIEURE', hasSpeciality: false },
            { name: 'L1', type: 'UNIVERSITY', hasSpeciality: false },
            { name: 'M1', type: 'UNIVERSITY', hasSpeciality: true },
        ],
        modules: [
            ['Linear Algebra', 'Vector spaces, linear maps, eigenvalues and diagonalisation.'],
            ['Real Analysis', 'Sequences, series, continuity, differentiation and integration.'],
            ['Probability Theory', 'Random variables, distributions, expectation and limit theorems.'],
            ['Statistics', 'Estimation, hypothesis testing, regression and analysis of variance.'],
            ['Numerical Methods', 'Root finding, interpolation, numerical integration and stability.'],
            ['Discrete Mathematics', 'Set theory, combinatorics, graph theory and mathematical logic.'],
            ['Differential Equations', 'Ordinary and partial differential equations with applications.'],
            ['Optimisation', 'Linear programming, convexity, duality and gradient methods.'],
            ['Topology', 'Metric spaces, compactness, connectedness and continuity.'],
            ['Measure Theory', 'Sigma-algebras, Lebesgue measure and integration.'],
            ['Complex Analysis', 'Holomorphic functions, contour integration and residues.'],
            ['Abstract Algebra', 'Groups, rings, fields and homomorphisms.'],
            ['Graph Theory', 'Connectivity, matchings, colouring and network flows.'],
            ['Stochastic Processes', 'Markov chains, Poisson processes and queueing models.'],
            ['Operations Research', 'Simplex method, network models and integer programming.'],
        ],
    },
    {
        name: 'Electrical Engineering',
        code: 'EE',
        speciality: 'IV',
        levels: [
            { name: 'L2', type: 'UNIVERSITY', hasSpeciality: false },
            { name: 'L3', type: 'UNIVERSITY', hasSpeciality: false },
            { name: 'CS3', type: 'ECOLE_SUPERIEURE', hasSpeciality: true },
        ],
        modules: [
            ['Circuit Analysis', 'Kirchhoff laws, transient response and AC steady-state analysis.'],
            ['Digital Electronics', 'Boolean algebra, combinational and sequential logic design.'],
            ['Signal Processing', 'Fourier analysis, sampling, filtering and the discrete Fourier transform.'],
            ['Control Systems', 'Feedback, stability criteria, root locus and frequency response.'],
            ['Embedded Systems', 'Microcontroller architecture, interrupts, timers and real-time constraints.'],
            ['Power Electronics', 'Rectifiers, inverters, converters and motor drives.'],
            ['Electromagnetics', 'Maxwell equations, wave propagation and transmission lines.'],
            ['Microprocessor Architecture', 'Instruction sets, pipelining, caching and memory hierarchy.'],
            ['Telecommunications', 'Modulation, channel capacity, noise and error correction.'],
            ['Instrumentation', 'Sensors, data acquisition, calibration and measurement error.'],
            ['Analogue Electronics', 'Amplifiers, operational amplifier circuits and frequency response.'],
            ['Electrical Machines', 'Transformers, induction machines and synchronous generators.'],
            ['Renewable Energy Systems', 'Photovoltaic conversion, wind systems and grid integration.'],
            ['VLSI Design', 'CMOS logic, layout, timing analysis and hardware description languages.'],
            ['Robotics', 'Kinematics, actuation, sensing and trajectory planning.'],
        ],
    },
    {
        name: 'Management',
        code: 'MGT',
        speciality: 'MG',
        levels: [
            { name: 'L1', type: 'UNIVERSITY', hasSpeciality: false, alias: 'L1-MGT' },
            { name: 'M2', type: 'UNIVERSITY', hasSpeciality: true },
            { name: 'CP1', type: 'ECOLE_SUPERIEURE', hasSpeciality: false, alias: 'CP1-MGT' },
        ],
        modules: [
            ['Principles of Management', 'Planning, organising, leading and controlling in organisations.'],
            ['Financial Accounting', 'Journal entries, the general ledger and financial statements.'],
            ['Marketing Fundamentals', 'Segmentation, targeting, positioning and the marketing mix.'],
            ['Corporate Finance', 'Time value of money, capital budgeting and cost of capital.'],
            ['Operations Management', 'Process design, capacity planning, inventory and quality control.'],
            ['Human Resource Management', 'Recruitment, appraisal, compensation and labour relations.'],
            ['Business Law', 'Contracts, company forms, commercial obligations and liability.'],
            ['Strategic Management', 'Competitive analysis, value chains and corporate strategy.'],
            ['Entrepreneurship', 'Opportunity assessment, business models and venture financing.'],
            ['Business Analytics', 'Descriptive and predictive analysis for managerial decisions.'],
            ['Managerial Accounting', 'Cost behaviour, budgeting, variance analysis and decision costing.'],
            ['Organisational Behaviour', 'Motivation, group dynamics, leadership and organisational culture.'],
            ['Supply Chain Management', 'Sourcing, logistics, distribution networks and demand planning.'],
            ['International Business', 'Trade theory, entry modes, exchange risk and cross-cultural management.'],
            ['Project Management', 'Scope, scheduling, critical path, risk and stakeholder management.'],
        ],
    },
];

// Content titles are week-numbered so a module page reads like a real syllabus
// rather than a list of interchangeable files.
const CONTENT_TOPICS = {
    'Algorithms and Complexity': ['Asymptotic Notation', 'Divide and Conquer', 'Greedy Algorithms', 'Dynamic Programming', 'Graph Traversal', 'Shortest Paths', 'NP-Completeness'],
    Databases: ['The Relational Model', 'Relational Algebra', 'SQL Queries', 'Normalization', 'Indexing', 'Transactions', 'Concurrency Control'],
    'Operating Systems': ['Processes and Threads', 'CPU Scheduling', 'Synchronisation', 'Deadlocks', 'Virtual Memory', 'File Systems', 'I/O Subsystems'],
    'Computer Networks': ['The OSI Model', 'Ethernet and the Link Layer', 'IP Addressing', 'Routing Algorithms', 'TCP and Flow Control', 'DNS and HTTP', 'Network Security'],
};

// Fallback used by every module without an explicit outline above.
const GENERIC_TOPICS = [
    'Course Introduction',
    'Foundations',
    'Core Concepts',
    'Applied Methods',
    'Case Study',
    'Advanced Topics',
    'Revision and Exam Preparation',
];

const CONTENT_TYPES = ['COURSE', 'TD', 'TP', 'OTHER'];

// Assignment titles are drawn per content type so deadlines read plausibly.
const ASSIGNMENT_KINDS = [
    { label: 'Homework', weight: 4 },
    { label: 'Lab Report', weight: 3 },
    { label: 'Project Milestone', weight: 2 },
    { label: 'Take-Home Exam', weight: 1 },
];

const topicsFor = (moduleName) => CONTENT_TOPICS[moduleName] || GENERIC_TOPICS;

module.exports = {
    DEPARTMENTS,
    CONTENT_TYPES,
    ASSIGNMENT_KINDS,
    topicsFor,
};
