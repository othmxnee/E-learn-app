// Per-topic lecture notes for the demo corpus.
//
// The 15 hand-written notes in notes.js are one document per subject area, so
// every weekly material inside a module pointed at the same file: "Week 4 —
// Divide and Conquer" contained the Week 1 asymptotic-notation text. Asking
// the assistant about week 4 then produced a correct but useless answer, since
// the retrieved excerpt genuinely had nothing about week 4 in it.
//
// These entries give each weekly topic its own content. They are short by
// design — enough substance to answer a question about that week and to be
// told apart from a neighbouring week, without pretending to be a full lecture.

// Written per topic, keyed by the topic name the catalogue uses.
const TOPIC_NOTES = {
    // ---- Computer Science: Algorithms and Complexity
    'Asymptotic Notation': [
        ['Why complexity matters', 'Measuring an algorithm by wall-clock time describes the machine as much as the method. Counting how the number of elementary operations grows with the input size is a property of the algorithm itself, and survives a change of hardware, language or compiler.'],
        ['The three bounds', 'Big-O states an upper bound: f(n) = O(g(n)) when f(n) <= c*g(n) beyond some n0. Big-Omega states the matching lower bound, and Big-Theta applies when the two agree, pinning the growth rate exactly. Quote the tightest bound you can prove — binary search is O(n), but saying so is useless when it is Theta(log n).'],
        ['Reading the common rates', 'Constant O(1) covers array indexing. Logarithmic O(log n) arises when the input halves each step. Linear O(n) examines each element once, linearithmic O(n log n) is the comparison-sorting bound, quadratic O(n^2) comes from nested loops over one collection, and exponential O(2^n) from exhaustive search over subsets.'],
        ['Worst, average and amortised', 'Worst case bounds every input and is the usual quotation. Average case assumes a distribution, which is why quicksort is called O(n log n) despite a quadratic worst case. Amortised cost averages over a sequence: a doubling dynamic array copies occasionally, yet costs constant time per insertion overall.'],
    ],
    'Divide and Conquer': [
        ['The three steps', 'Divide the problem into smaller instances of the same problem, conquer each by solving it recursively, and combine the partial results into an answer for the original. The pattern applies whenever subproblems are independent and combining them is cheaper than solving the whole directly.'],
        ['Worked examples', 'Merge sort splits the array in half, sorts each half, and merges the two sorted runs in linear time. Binary search discards half the search space per comparison. Quicksort partitions around a pivot so that combining is free, moving the work into the divide step instead.'],
        ['Recurrences and the master theorem', 'A divide-and-conquer algorithm is described by T(n) = aT(n/b) + f(n), where a is the number of subproblems, n/b their size, and f(n) the cost of dividing and combining. The master theorem compares f(n) with n^(log_b a): whichever dominates sets the result, and a tie introduces a logarithmic factor. Merge sort gives T(n) = 2T(n/2) + O(n), which resolves to Theta(n log n).'],
        ['When it does not apply', 'Overlapping subproblems make plain recursion re-solve the same instance repeatedly — naive Fibonacci is exponential for this reason. That case calls for dynamic programming, which memoises results rather than recomputing them.'],
    ],
    'Greedy Algorithms': [
        ['The greedy choice', 'A greedy algorithm builds a solution by repeatedly taking the option that looks best right now, never reconsidering. It is the simplest strategy available, and it is correct only when local optimality implies global optimality.'],
        ['When greedy is provably correct', 'Two properties are needed. The greedy-choice property: some optimal solution begins with the locally best choice. Optimal substructure: an optimal solution contains optimal solutions to its subproblems. Activity selection by earliest finishing time, Huffman coding, and the minimum-spanning-tree algorithms of Kruskal and Prim all satisfy both.'],
        ['Where greedy fails', 'The 0/1 knapsack problem defeats a greedy choice by value density — taking the densest item first can strand capacity that a different combination would have used. The fractional knapsack, where items may be split, is greedy-solvable. The difference is a reminder to prove the greedy-choice property rather than assume it.'],
        ['Greedy against dynamic programming', 'Both rely on optimal substructure. Greedy commits to one choice and never revisits it, giving speed; dynamic programming explores the choices it cannot rule out, giving generality at higher cost. Try to prove greedy correct first, and fall back to dynamic programming when the proof fails.'],
    ],

    // ---- Computer Science: Databases
    'The Relational Model': [
        ['Relations, tuples and domains', 'A relation is a set of tuples over a fixed set of attributes. Being a set, it has no inherent row order and no duplicates. Each attribute draws values from a domain, and NULL marks information that is absent or inapplicable.'],
        ['Keys', 'A candidate key is a minimal attribute set that uniquely identifies a tuple. One is designated the primary key; the rest remain alternate keys, usually enforced with unique constraints. A foreign key holds values that must appear as a key in another relation, which is how referential integrity is expressed.'],
        ['Integrity constraints', 'Entity integrity forbids a NULL in any part of a primary key. Referential integrity requires every non-null foreign key value to match an existing key. Domain constraints restrict the values an attribute may take. Together they are the guarantees the database enforces regardless of the application on top of it.'],
    ],
    'Relational Algebra': [
        ['Why an algebra', 'Relational algebra gives a small set of operators that take relations and return relations. Because the result is itself a relation, operators compose, and a query optimiser can rewrite one expression into an equivalent, cheaper one.'],
        ['The core operators', 'Selection (sigma) keeps tuples satisfying a predicate. Projection (pi) keeps a subset of attributes, discarding duplicates. Union, difference and intersection apply to union-compatible relations. The Cartesian product pairs every tuple of one relation with every tuple of another. Rename (rho) supplies names where an expression would otherwise be ambiguous.'],
        ['Joins', 'A theta join is a product followed by a selection; an equijoin restricts that predicate to equality. The natural join equates all attributes sharing a name and drops the duplicated columns. Outer joins retain unmatched tuples from one or both sides, padding the missing attributes with NULL.'],
        ['Algebra and SQL', 'SQL is declarative — it states what is wanted, not how to compute it. The engine translates a query into an algebraic expression, then rewrites it: pushing selections below joins, for instance, shrinks intermediate results and is one of the most effective optimisations available.'],
    ],
    'Normalization': [
        ['Functional dependencies', 'X -> Y holds when any two tuples agreeing on X must agree on Y. Functional dependencies encode the rules of the domain and are the raw material of normalization. Armstrong axioms — reflexivity, augmentation, transitivity — derive every dependency implied by a set, and an attribute closure reveals whether a set is a superkey.'],
        ['Update anomalies', 'A poorly factored table shows three symptoms. An insertion anomaly prevents recording a fact because unrelated information is missing. A deletion anomaly loses a fact as a side effect of removing another. An update anomaly requires the same fact to be changed in many rows, leaving inconsistency if any are missed.'],
        ['The normal forms', 'First normal form requires atomic attributes. Second forbids partial dependency of a non-key attribute on part of a composite key. Third forbids transitive dependency of one non-key attribute on another. Boyce-Codd tightens third: every non-trivial determinant must be a superkey.'],
        ['Denormalising deliberately', 'Normalization optimises for correctness under update; read-heavy workloads sometimes pay for that in join cost. A measured, documented denormalization — a materialised aggregate, a duplicated lookup column — is legitimate engineering. An undocumented duplicate is a bug waiting to happen.'],
    ],
    'SQL Queries': [
        ['Logical evaluation order', 'A SELECT is written SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, but evaluated FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY. This explains why a column alias defined in SELECT cannot be used in WHERE, yet can be used in ORDER BY.'],
        ['Filtering and grouping', 'WHERE filters individual rows before grouping; HAVING filters groups after aggregation. Aggregates — COUNT, SUM, AVG, MIN, MAX — ignore NULL, with the exception of COUNT(*), which counts rows. Any non-aggregated column in the SELECT list must appear in GROUP BY.'],
        ['Joins in SQL', 'INNER JOIN keeps only matching pairs. LEFT and RIGHT OUTER JOIN keep unmatched rows from one side, filling the other with NULL. FULL OUTER keeps both. A missing join predicate silently produces a Cartesian product, which is the usual cause of a query that returns far more rows than expected.'],
        ['NULL and three-valued logic', 'Comparison with NULL yields UNKNOWN, not true or false, so WHERE x = NULL never matches — IS NULL is required. UNKNOWN in a WHERE clause behaves as false, which is why NOT IN against a subquery containing a NULL returns no rows at all.'],
    ],

    // ---- Mathematics: Linear Algebra
    'Foundations': [
        ['Purpose of the module', 'This week fixes the vocabulary the rest of the course depends on: the objects being studied, the operations defined on them, and the notation used throughout. Later material assumes these definitions without restating them.'],
        ['Definitions and notation', 'Terms introduced here are used in their precise technical sense, which often differs from everyday usage. Where a symbol is introduced, its meaning holds for the remainder of the module unless explicitly redefined.'],
        ['Prerequisites', 'The material assumes fluency with the preceding year of study. Where a prerequisite result is needed it is stated without proof and referenced, so gaps can be filled independently.'],
    ],
    'Core Concepts': [
        ['The central results', 'This week presents the principal results of the module and the conditions under which they hold. Each is stated formally before being applied, since the conditions are what determine whether a result may be used in a given situation.'],
        ['Applying the results', 'Worked examples show the standard method of application, including the checks that must be performed before a theorem may be invoked. Skipping those checks is the most common source of error in assessed work.'],
        ['Common mistakes', 'Misapplying a result outside its hypotheses, and confusing a necessary condition with a sufficient one, account for most lost marks. Both are avoided by returning to the formal statement rather than working from memory of the example.'],
    ],
    'Course Introduction': [
        ['Scope and objectives', 'This session sets out what the module covers, how the topics connect, and what students are expected to be able to do by the end. It is the map for the weeks that follow.'],
        ['Assessment', 'Assessment combines continuous work through the semester with a final examination. Continuous work is designed to give feedback early enough to act on, so submissions are graded and returned promptly.'],
        ['How to study this module', 'The material builds cumulatively: each week assumes the previous one. Working the exercises as they are set, rather than in a block before the examination, is the single strongest predictor of success in this module.'],
    ],
};

// Every topic in the catalogue that has no bespoke entry falls back to a
// short, generic-but-coherent note built from its own name, so a material is
// at least about the thing its title claims.
const genericSections = (topic, moduleName) => [
    ['Overview', `This session introduces ${topic.toLowerCase()} within ${moduleName}. It sets out the definitions used, the situations in which the material applies, and how it connects to the surrounding weeks of the module.`],
    ['Key ideas', `The central ideas of ${topic.toLowerCase()} are developed from first principles and then applied to worked examples. Emphasis is placed on the conditions under which each result holds, since applying a result outside its hypotheses is the most frequent source of error.`],
    ['In practice', `Exercises for this week apply ${topic.toLowerCase()} to problems of the kind met in assessment. Working them alongside the notes, rather than afterwards, is the intended use of this material.`],
];

// Builds the document passed to the PDF writer.
const buildTopicNote = (topic, moduleName, departmentName) => {
    const sections = TOPIC_NOTES[topic] || genericSections(topic, moduleName);

    return {
        title: topic,
        subtitle: `${moduleName} - ${departmentName}`,
        sections: sections.map(([heading, body], index) => ({
            heading: `${index + 1}. ${heading}`,
            body,
        })),
    };
};

// Stable, filesystem-safe filename for a module+topic pair.
const topicFileName = (moduleName, topic) => {
    const slug = (value) =>
        value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `${slug(moduleName)}--${slug(topic)}.pdf`;
};

module.exports = { buildTopicNote, topicFileName, TOPIC_NOTES };
