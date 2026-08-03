// Source text for the demo course notes.
//
// These are the only real files in the dataset: the ~180 seeded materials all
// point back at these 15 PDFs, reused across modules, so storage stays small
// and — once Part 2 lands — the embedding cost is 15 documents rather than 180.
//
// The prose is written for this repository, so it carries no third-party
// licence. Each note is deliberately substantive enough to be worth retrieving
// against, not lorem ipsum.

const NOTES = [
    {
        file: 'cs-algorithms-complexity.pdf',
        topic: 'Algorithms and Complexity',
        title: 'Algorithmic Complexity',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. Why complexity matters',
                body: `Measuring an algorithm by the wall-clock time it takes on one machine tells you about the machine as much as the algorithm. Complexity analysis instead counts how the number of elementary operations grows as the input grows, which is a property of the algorithm alone and survives a change of hardware, language or compiler.

We care about growth because constant factors stop mattering once inputs get large. An algorithm running in 100n steps beats one running in n^2 steps for every n above 100, and the gap widens without bound.`,
            },
            {
                heading: '2. Asymptotic notation',
                body: `Big-O gives an upper bound: f(n) = O(g(n)) when there exist constants c and n0 such that f(n) <= c*g(n) for all n >= n0. Big-Omega gives the corresponding lower bound, and Big-Theta applies when the upper and lower bounds agree, pinning the growth rate exactly.

In practice we quote the tightest bound we can prove. Saying that binary search is O(n) is true but useless; it is Theta(log n).`,
            },
            {
                heading: '3. Common growth rates',
                body: `Constant time O(1) covers array indexing and hash table lookup in the average case. Logarithmic time O(log n) arises whenever the input is halved each step, as in binary search or balanced tree descent. Linear time O(n) is the cost of examining every element once.

Linearithmic time O(n log n) is the bound for comparison-based sorting, achieved by merge sort and heap sort. Quadratic time O(n^2) appears in nested loops over the same collection, and exponential time O(2^n) in exhaustive search over subsets.`,
            },
            {
                heading: '4. Analysing recursive algorithms',
                body: `Recursive algorithms are described by recurrence relations. Merge sort splits its input in half and does linear work merging, giving T(n) = 2T(n/2) + O(n), which resolves to Theta(n log n).

The master theorem handles recurrences of the form T(n) = aT(n/b) + f(n) by comparing f(n) against n^(log_b a). Whichever term dominates determines the result; when they match, a logarithmic factor is introduced.`,
            },
            {
                heading: '5. Worst, average and amortised cost',
                body: `Worst-case analysis bounds every input and is what we usually quote. Average-case analysis assumes a distribution over inputs, which is why quicksort is described as O(n log n) on average despite a quadratic worst case.

Amortised analysis averages cost over a sequence of operations. A dynamic array that doubles its capacity when full performs an expensive copy occasionally, but the cost spread across all insertions is constant per insertion.`,
            },
        ],
    },
    {
        file: 'cs-databases-normalization.pdf',
        topic: 'Databases',
        title: 'Relational Design and Normalization',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. The relational model',
                body: `A relation is a set of tuples over a fixed set of attributes. Because it is a set, there is no inherent ordering of rows and no duplicates. Each attribute draws values from a domain, and the special value NULL marks information that is absent or inapplicable.

A candidate key is a minimal set of attributes that uniquely identifies a tuple. One candidate key is designated the primary key; the others remain alternate keys and are usually enforced with unique constraints.`,
            },
            {
                heading: '2. Functional dependencies',
                body: `An attribute set Y is functionally dependent on X, written X -> Y, when any two tuples agreeing on X must agree on Y. Functional dependencies encode the business rules of the domain and are the raw material of normalization.

Armstrong's axioms - reflexivity, augmentation and transitivity - let us derive every dependency implied by a given set, and computing the closure of an attribute set tells us whether it is a superkey.`,
            },
            {
                heading: '3. Update anomalies',
                body: `A poorly factored table suffers three characteristic problems. An insertion anomaly prevents recording a fact because unrelated information is missing. A deletion anomaly loses a fact as a side effect of removing something else. An update anomaly requires the same fact to be changed in many rows, and leaves the table inconsistent if any are missed.

Normalization removes these anomalies by splitting relations so that every fact is stored exactly once.`,
            },
            {
                heading: '4. The normal forms',
                body: `First normal form requires every attribute to be atomic, ruling out repeating groups and nested structures. Second normal form additionally forbids partial dependencies, where a non-key attribute depends on only part of a composite key.

Third normal form forbids transitive dependencies, where a non-key attribute depends on another non-key attribute. Boyce-Codd normal form tightens this: every non-trivial determinant must be a superkey. Higher forms address multi-valued and join dependencies and are rarely needed in practice.`,
            },
            {
                heading: '5. When to denormalize',
                body: `Normalization optimises for correctness under update. Read-heavy workloads sometimes pay for that in join cost, and a controlled denormalization - a materialised aggregate, a duplicated lookup column - can be the right engineering trade.

Denormalize deliberately, after measuring, and document which copy is authoritative. An undocumented duplicate is simply a bug waiting to surface.`,
            },
        ],
    },
    {
        file: 'cs-operating-systems.pdf',
        topic: 'Operating Systems',
        title: 'Processes, Scheduling and Memory',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. Processes and threads',
                body: `A process is a program in execution together with the state the kernel maintains for it: address space, open file descriptors, and scheduling information. Threads share an address space within a process, which makes communication cheap and synchronisation mandatory.

Context switching between processes requires swapping address spaces and flushing translation caches, which is why thread switches are markedly cheaper.`,
            },
            {
                heading: '2. CPU scheduling',
                body: `First-come first-served is trivial but suffers convoy effects, where a long job delays every short one behind it. Shortest-job-first minimises average waiting time but needs knowledge of burst lengths and can starve long jobs.

Round-robin assigns each process a time quantum and cycles through the ready queue, trading throughput for responsiveness. Multilevel feedback queues approximate shortest-job-first adaptively by demoting processes that use their full quantum.`,
            },
            {
                heading: '3. Synchronisation',
                body: `A race condition arises when the result depends on the interleaving of concurrent accesses to shared state. The critical section problem asks for mutual exclusion, progress and bounded waiting.

Mutexes provide exclusion, semaphores generalise to counted resources, and condition variables let a thread wait for a predicate to become true. Monitors bundle the lock with the data it protects, which is the pattern most modern languages expose.`,
            },
            {
                heading: '4. Deadlock',
                body: `Deadlock requires four simultaneous conditions: mutual exclusion, hold-and-wait, no preemption, and circular wait. Breaking any one of them prevents deadlock.

Systems either prevent deadlock by design - most often by imposing a global lock ordering, which breaks circular wait - or detect it and recover. Avoidance algorithms such as the banker's algorithm exist but need advance knowledge of maximum resource claims and are rarely practical.`,
            },
            {
                heading: '5. Virtual memory',
                body: `Paging maps fixed-size virtual pages onto physical frames through a page table, giving each process an isolated address space larger than physical memory. The translation lookaside buffer caches recent translations, without which every access would cost an extra memory reference.

When a referenced page is not resident, a page fault traps to the kernel, which loads the page and possibly evicts another. Replacement policies approximate the optimal algorithm; least-recently-used and clock are the usual choices. Thrashing occurs when the working set exceeds available frames and the system spends its time paging rather than computing.`,
            },
        ],
    },
    {
        file: 'cs-computer-networks.pdf',
        topic: 'Computer Networks',
        title: 'The TCP/IP Protocol Stack',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. Layered architecture',
                body: `Networking is organised in layers so each can be designed and replaced independently. The link layer moves frames between directly connected nodes, the network layer routes packets across networks, the transport layer provides process-to-process channels, and the application layer defines what the exchanged data means.

Each layer adds a header on the way down and strips it on the way up. This encapsulation is what allows HTTP to run unchanged over Ethernet, Wi-Fi or a cellular link.`,
            },
            {
                heading: '2. Addressing and forwarding',
                body: `An IPv4 address is 32 bits, conventionally written as four decimal octets, and is split into network and host portions by a prefix length. Classless inter-domain routing allocates prefixes of any length, which slowed address exhaustion and keeps routing tables aggregated.

A router forwards a packet by finding the longest matching prefix in its table and sending the packet to the corresponding next hop. Forwarding is the per-packet operation; routing is the background protocol that populates the table.`,
            },
            {
                heading: '3. Reliable transport',
                body: `IP is best-effort: packets may be dropped, duplicated or reordered. TCP builds a reliable ordered byte stream on top using sequence numbers, cumulative acknowledgements and retransmission on timeout or duplicate acknowledgement.

The connection is established with a three-way handshake that synchronises initial sequence numbers in both directions. UDP omits all of this, offering only multiplexing and an optional checksum, which suits applications that prefer timeliness to completeness.`,
            },
            {
                heading: '4. Flow and congestion control',
                body: `Flow control stops a fast sender from overwhelming a slow receiver, using the advertised window the receiver returns in every acknowledgement.

Congestion control protects the network itself. TCP probes for available capacity with slow start, growing the congestion window exponentially until loss occurs, then switches to additive-increase multiplicative-decrease. Treating loss as a congestion signal is the assumption that keeps the shared network stable.`,
            },
            {
                heading: '5. Naming and the application layer',
                body: `DNS resolves hierarchical names to addresses through a delegated tree of authoritative servers, with aggressive caching at every level to keep the load tractable.

HTTP is a request-response protocol whose statelessness is what makes it scale; cookies and tokens reintroduce session state where an application needs it. TLS wraps the transport in authenticated encryption, which is now the default rather than the exception.`,
            },
        ],
    },
    {
        file: 'cs-software-engineering.pdf',
        topic: 'Software Engineering',
        title: 'Design, Testing and Version Control',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. Requirements',
                body: `Functional requirements say what the system must do; non-functional requirements constrain how well - latency, availability, security, accessibility. Non-functional requirements are the ones most often discovered too late, after the architecture has already foreclosed them.

A requirement that cannot be tested cannot be verified. "The system should be fast" is not a requirement; "95th percentile response under 200ms at 1000 concurrent users" is.`,
            },
            {
                heading: '2. Coupling and cohesion',
                body: `Cohesion measures how strongly the responsibilities within a module belong together; coupling measures how much modules depend on one another. Good design maximises cohesion and minimises coupling, because that is what lets one part change without disturbing the rest.

Depending on an interface rather than a concrete implementation reduces coupling and is the basis of dependency inversion.`,
            },
            {
                heading: '3. Design patterns',
                body: `Patterns are named solutions to recurring design problems. Creational patterns such as factory and builder decouple construction from use. Structural patterns such as adapter and decorator compose objects into larger structures. Behavioural patterns such as observer and strategy assign responsibility for algorithms and communication.

Patterns are vocabulary, not goals. Applying one where the problem does not exist adds indirection and costs clarity.`,
            },
            {
                heading: '4. Testing strategy',
                body: `Unit tests exercise a single module in isolation and should be fast and numerous. Integration tests verify that modules work together, particularly across process and network boundaries. End-to-end tests drive the whole system as a user would; they catch the most and cost the most to maintain.

The pyramid recommends many unit tests, fewer integration tests and fewer still end-to-end tests. Coverage measures which lines ran, not whether behaviour is correct, so treat it as a diagnostic rather than a target.`,
            },
            {
                heading: '5. Version control',
                body: `A commit records a snapshot together with its parents, forming a directed acyclic graph. Branches are movable pointers into that graph, which is why creating one is cheap.

Merging combines divergent histories and records both parents; rebasing replays commits onto a new base, producing a linear history at the cost of rewriting commit identities. Never rebase history that others have already pulled.`,
            },
        ],
    },
    {
        file: 'cs-web-development.pdf',
        topic: 'Web Development',
        title: 'Client-Server Architecture on the Web',
        subtitle: 'Course notes - Department of Computer Science',
        sections: [
            {
                heading: '1. The request-response cycle',
                body: `A browser resolves a hostname, opens a connection, sends an HTTP request and receives a response. The method conveys intent - GET to read, POST to create, PUT to replace, PATCH to modify, DELETE to remove - and the status code conveys the outcome.

GET and HEAD must be safe, meaning free of observable side effects. GET, PUT and DELETE must be idempotent: repeating them leaves the same state, which is what makes retries safe.`,
            },
            {
                heading: '2. REST API design',
                body: `A REST resource is identified by a URL and manipulated through the uniform interface. Paths name nouns and the method supplies the verb, so /students/42/submissions is preferred over /getStudentSubmissions.

Return 200 for a successful read, 201 with a Location header when creating, 400 for malformed input, 401 when unauthenticated, 403 when authenticated but not permitted, and 404 when the resource does not exist. Using 200 with an error body defeats every intermediary that inspects status codes.`,
            },
            {
                heading: '3. Authentication and sessions',
                body: `HTTP is stateless, so identity must be carried on each request. Server-side sessions store state keyed by a cookie; token schemes such as JWT carry signed claims in the request itself, trading revocability for statelessness.

Store tokens carefully. Anything readable by JavaScript is exposed to cross-site scripting; cookies marked HttpOnly and SameSite resist that but require attention to cross-site request forgery.`,
            },
            {
                heading: '4. The browser security model',
                body: `The same-origin policy isolates documents by scheme, host and port. Cross-origin resource sharing relaxes it explicitly: the server names permitted origins, and the browser enforces the decision.

Cross-site scripting is prevented by escaping untrusted data at the point of output and by a content security policy. SQL injection is prevented by parameterised queries. Both share a root cause, which is treating data as code.`,
            },
            {
                heading: '5. Client-side rendering',
                body: `Single-page applications render in the browser and fetch data asynchronously, which makes navigation feel immediate but shifts cost onto the client and complicates initial load and indexing.

Server-side rendering returns markup ready to display and hydrates it afterwards. The choice is a trade between time-to-first-byte, time-to-interactive and operational complexity, and it should follow the application's actual audience.`,
            },
        ],
    },
    {
        file: 'math-linear-algebra.pdf',
        topic: 'Linear Algebra',
        title: 'Vector Spaces and Linear Maps',
        subtitle: 'Course notes - Department of Mathematics',
        sections: [
            {
                heading: '1. Vector spaces',
                body: `A vector space over a field consists of a set closed under addition and scalar multiplication, satisfying associativity, commutativity of addition, distributivity, and the existence of a zero vector and additive inverses.

A subspace is a subset that is itself a vector space, which reduces to being non-empty and closed under both operations. The span of a set is the smallest subspace containing it.`,
            },
            {
                heading: '2. Basis and dimension',
                body: `A set is linearly independent when no non-trivial linear combination gives the zero vector. A basis is an independent spanning set, and every basis of a given space has the same cardinality, which is the dimension.

Coordinates relative to a basis turn abstract vectors into tuples, which is what makes computation possible. Changing basis is itself a linear map, represented by an invertible matrix.`,
            },
            {
                heading: '3. Linear maps and matrices',
                body: `A linear map preserves addition and scalar multiplication. Once bases are fixed, every linear map between finite-dimensional spaces is represented by a matrix, and composition of maps corresponds to matrix multiplication.

The rank-nullity theorem states that the dimension of the domain equals the rank plus the nullity. It immediately explains when a square system has a unique solution: precisely when the nullity is zero.`,
            },
            {
                heading: '4. Determinants',
                body: `The determinant is the unique alternating multilinear function of the columns taking the value one on the identity. Geometrically it is the signed volume scaling factor of the map.

A matrix is invertible exactly when its determinant is non-zero. Determinants are indispensable in theory but a poor computational tool; Gaussian elimination is what one actually runs.`,
            },
            {
                heading: '5. Eigenvalues and diagonalisation',
                body: `A scalar lambda is an eigenvalue of A when Av = lambda*v for some non-zero v. The eigenvalues are the roots of the characteristic polynomial det(A - lambda*I).

A matrix is diagonalisable when its eigenvectors form a basis, in which case A = PDP^-1 and powers of A become trivial to compute. Symmetric real matrices are always orthogonally diagonalisable with real eigenvalues, which is the spectral theorem.`,
            },
        ],
    },
    {
        file: 'math-probability.pdf',
        topic: 'Probability Theory',
        title: 'Random Variables and Limit Theorems',
        subtitle: 'Course notes - Department of Mathematics',
        sections: [
            {
                heading: '1. Probability spaces',
                body: `A probability space consists of a sample space of outcomes, a sigma-algebra of measurable events, and a measure assigning each event a number in [0,1] with the whole space having measure one and countable additivity holding for disjoint events.

Conditional probability P(A|B) = P(A and B)/P(B) renormalises to the information that B occurred. Independence means P(A and B) = P(A)P(B), which is a statement about the measure, not about causation.`,
            },
            {
                heading: '2. Random variables',
                body: `A random variable is a measurable function from the sample space to the reals. Its distribution is characterised by the cumulative distribution function, and where it exists by a probability mass or density function.

Expectation is the integral of the variable against the measure and is linear regardless of dependence. Variance measures spread and adds only for uncorrelated variables.`,
            },
            {
                heading: '3. Standard distributions',
                body: `The Bernoulli distribution models a single trial, and the binomial counts successes across independent trials. The Poisson distribution arises as the limit of rare events over a fixed interval and models arrival counts.

The normal distribution is characterised by its mean and variance and is the limit that the central limit theorem produces. The exponential distribution models waiting times and is the unique continuous memoryless distribution.`,
            },
            {
                heading: '4. Bayes theorem',
                body: `Bayes theorem inverts a conditional: P(A|B) = P(B|A)P(A)/P(B). It is the formal mechanism for updating a prior belief in light of evidence to yield a posterior.

The base rate fallacy is what happens when the prior is ignored. A test that is 99 percent accurate for a condition affecting one person in ten thousand still yields mostly false positives, because the prior dominates.`,
            },
            {
                heading: '5. Limit theorems',
                body: `The law of large numbers states that the sample mean of independent identically distributed variables converges to the expectation, in probability for the weak form and almost surely for the strong form.

The central limit theorem states that the standardised sample mean converges in distribution to the standard normal, whatever the underlying distribution, provided the variance is finite. This is why the normal distribution appears so widely and why it underpins confidence intervals.`,
            },
        ],
    },
    {
        file: 'math-statistics.pdf',
        topic: 'Statistics',
        title: 'Estimation and Hypothesis Testing',
        subtitle: 'Course notes - Department of Mathematics',
        sections: [
            {
                heading: '1. Populations and samples',
                body: `Statistics infers properties of a population from a sample. The inference is only as good as the sampling: a biased sample cannot be rescued by a larger size, it merely produces a more confident wrong answer.

A statistic is any function of the sample. Its distribution across hypothetical repeated samples - the sampling distribution - is what licenses every inferential claim.`,
            },
            {
                heading: '2. Point estimation',
                body: `An estimator is unbiased when its expectation equals the parameter. Consistency means it converges to the parameter as the sample grows. Efficiency compares variances among unbiased estimators.

Maximum likelihood chooses the parameter making the observed data most probable. It is consistent and asymptotically efficient under regularity conditions, which is why it is the default method.`,
            },
            {
                heading: '3. Confidence intervals',
                body: `A 95 percent confidence interval is constructed so that the procedure captures the true parameter in 95 percent of repeated samples. The probability belongs to the procedure, not to any particular interval already computed.

Interval width shrinks with the square root of the sample size, so halving the width requires quadrupling the data.`,
            },
            {
                heading: '4. Hypothesis testing',
                body: `A test contrasts a null hypothesis with an alternative. The p-value is the probability, assuming the null is true, of observing a statistic at least as extreme as the one obtained. It is not the probability that the null is true.

A type I error rejects a true null, at rate alpha; a type II error fails to reject a false null, at rate beta. Power is 1 - beta and increases with sample size and effect size. Testing many hypotheses inflates the false positive rate and demands correction.`,
            },
            {
                heading: '5. Regression',
                body: `Simple linear regression fits a line by minimising the sum of squared residuals. The coefficient of determination reports the proportion of variance explained, and says nothing about whether the model is appropriate.

Inference on the coefficients assumes linearity, independent errors, constant variance and approximate normality of residuals. Plotting the residuals is the fastest way to discover that one of these has failed.`,
            },
        ],
    },
    {
        file: 'math-numerical-methods.pdf',
        topic: 'Numerical Methods',
        title: 'Numerical Computation and Stability',
        subtitle: 'Course notes - Department of Mathematics',
        sections: [
            {
                heading: '1. Floating point arithmetic',
                body: `Real numbers are represented in finite precision, so almost every value is stored with a relative error bounded by the machine epsilon. Floating point addition is not associative, and comparing computed values for exact equality is a defect.

Catastrophic cancellation occurs when subtracting nearly equal quantities: the leading digits cancel and the relative error in the result is dominated by earlier rounding. Reformulating the expression usually avoids it.`,
            },
            {
                heading: '2. Root finding',
                body: `Bisection brackets a root and halves the interval each step. It converges linearly but is unconditionally reliable once a sign change is found.

Newton's method converges quadratically near a simple root but needs the derivative and can diverge from a poor starting point. The secant method approximates the derivative by finite differences, trading a little convergence speed for not requiring it.`,
            },
            {
                heading: '3. Interpolation',
                body: `A polynomial of degree n passes through any n+1 distinct points, and that polynomial is unique. High-degree interpolation on equally spaced nodes oscillates wildly near the interval ends, which is Runge's phenomenon.

Splines avoid this by fitting low-degree polynomials piecewise with continuity conditions at the knots, which is why cubic splines dominate in practice.`,
            },
            {
                heading: '4. Numerical integration',
                body: `The trapezoidal rule approximates the integrand by straight segments with error O(h^2). Simpson's rule uses quadratic segments and achieves O(h^4) for smooth integrands.

Gaussian quadrature chooses both nodes and weights optimally, integrating polynomials of degree 2n-1 exactly with n points. Adaptive schemes concentrate effort where the integrand varies most.`,
            },
            {
                heading: '5. Conditioning and stability',
                body: `Conditioning is a property of the problem: an ill-conditioned problem amplifies input perturbations regardless of the algorithm used. Stability is a property of the algorithm: a stable algorithm does not amplify rounding beyond what conditioning already implies.

Solving a linear system whose condition number is large means losing roughly that many digits of accuracy. Recognising an ill-conditioned problem is more valuable than any refinement of the solver.`,
            },
        ],
    },
    {
        file: 'ee-signal-processing.pdf',
        topic: 'Signal Processing',
        title: 'Signals, Sampling and Filtering',
        subtitle: 'Course notes - Department of Electrical Engineering',
        sections: [
            {
                heading: '1. Signals and systems',
                body: `A signal carries information as a function of time or space; a system transforms one signal into another. Linear time-invariant systems are the tractable case, fully described by their impulse response.

The output of an LTI system is the convolution of the input with the impulse response, which in the frequency domain becomes simple multiplication. That equivalence is why frequency-domain analysis dominates.`,
            },
            {
                heading: '2. Fourier analysis',
                body: `The Fourier series decomposes a periodic signal into harmonically related sinusoids. The Fourier transform extends this to aperiodic signals, mapping a time-domain signal to a continuous spectrum.

Duality runs throughout: narrow in time means broad in frequency. A perfect impulse contains all frequencies, and a pure sinusoid must last forever.`,
            },
            {
                heading: '3. Sampling',
                body: `Sampling multiplies a continuous signal by an impulse train, which replicates its spectrum at multiples of the sampling rate. If those replicas overlap, the original cannot be recovered.

The Nyquist-Shannon theorem requires a sampling rate above twice the highest frequency present. Aliasing folds higher frequencies down onto lower ones irreversibly, so an analogue anti-aliasing filter must precede the converter.`,
            },
            {
                heading: '4. The discrete Fourier transform',
                body: `The DFT maps N samples to N frequency bins and implicitly assumes the block repeats periodically. A signal that does not complete a whole number of cycles in the window produces spectral leakage, which windowing functions reduce at the cost of resolution.

The fast Fourier transform computes the DFT in O(N log N) rather than O(N^2) by recursively exploiting symmetry. Its existence is what made digital signal processing practical.`,
            },
            {
                heading: '5. Digital filters',
                body: `Finite impulse response filters have no feedback, are always stable, and can be given exactly linear phase, which matters wherever waveform shape must be preserved.

Infinite impulse response filters use feedback to achieve a given magnitude response with far fewer coefficients, at the cost of possible instability and non-linear phase. Placing poles inside the unit circle is the stability requirement.`,
            },
        ],
    },
    {
        file: 'ee-control-systems.pdf',
        topic: 'Control Systems',
        title: 'Feedback and Stability',
        subtitle: 'Course notes - Department of Electrical Engineering',
        sections: [
            {
                heading: '1. Open and closed loop',
                body: `An open-loop controller applies a predetermined input and cannot correct for disturbance or model error. A closed-loop controller measures the output and drives the error to zero.

Feedback buys robustness to modelling error and disturbance rejection. It costs stability margin, which is the central trade of the subject.`,
            },
            {
                heading: '2. Transfer functions',
                body: `Applying the Laplace transform to a linear time-invariant differential equation turns it into an algebraic ratio of polynomials, the transfer function. Poles are the roots of the denominator and determine the natural response; zeros shape how strongly modes are excited.

A second-order system is characterised by its natural frequency and damping ratio, which set overshoot, rise time and settling time.`,
            },
            {
                heading: '3. Stability',
                body: `A continuous linear system is stable when every pole lies strictly in the left half-plane. The Routh-Hurwitz criterion determines this from the coefficients without computing the roots.

For discrete systems the corresponding region is the interior of the unit circle. Marginal stability, with poles exactly on the boundary, is a mathematical case rather than a practical design target.`,
            },
            {
                heading: '4. Root locus and frequency response',
                body: `The root locus traces closed-loop pole positions as a gain varies, showing directly how much gain the loop tolerates before instability.

Bode plots show magnitude and phase against frequency. Gain margin and phase margin quantify how much extra gain or delay the loop can absorb; a phase margin near 45 to 60 degrees is a common design target. The Nyquist criterion relates encirclements of the critical point to closed-loop stability and handles cases Bode analysis cannot.`,
            },
            {
                heading: '5. PID control',
                body: `Proportional action responds to present error, integral action eliminates steady-state error by accumulating history, and derivative action anticipates by responding to the rate of change.

Integral windup occurs when the actuator saturates while the integral term keeps accumulating, producing large overshoot on recovery; clamping the integrator prevents it. Derivative action amplifies measurement noise and is normally filtered or omitted.`,
            },
        ],
    },
    {
        file: 'ee-embedded-systems.pdf',
        topic: 'Embedded Systems',
        title: 'Microcontrollers and Real-Time Constraints',
        subtitle: 'Course notes - Department of Electrical Engineering',
        sections: [
            {
                heading: '1. Microcontroller architecture',
                body: `A microcontroller integrates processor, memory and peripherals on one device. Harvard architectures separate instruction and data memory, allowing simultaneous access, whereas von Neumann designs share one bus.

Flash holds the program, SRAM holds working data, and memory-mapped registers expose peripherals. Programming embedded systems is largely the discipline of writing correct values to the right registers in the right order.`,
            },
            {
                heading: '2. Interrupts',
                body: `An interrupt suspends normal execution to run a handler, letting the processor respond to events without polling. The vector table maps each source to its handler, and priority determines what may preempt what.

Handlers must be short and must not block. Data shared with the main program requires either atomic access or explicit critical sections, and any variable modified in a handler must be declared volatile.`,
            },
            {
                heading: '3. Timers and PWM',
                body: `A timer counts clock ticks and can generate periodic interrupts, capture the time of an input edge, or drive an output. It is the basis of every scheduled activity on the device.

Pulse-width modulation varies duty cycle at fixed frequency to control average delivered power, which is how motor speed and LED brightness are set without analogue circuitry.`,
            },
            {
                heading: '4. Communication interfaces',
                body: `UART provides asynchronous point-to-point serial communication with both ends configured to the same baud rate. SPI is synchronous, full duplex and fast, using a chip select per peripheral.

I2C uses two wires shared by many devices, addressing each by a 7-bit address, trading throughput for pin count. The choice among them is usually dictated by the peripheral rather than by preference.`,
            },
            {
                heading: '5. Real-time scheduling',
                body: `A hard real-time system fails if a deadline is missed; a soft real-time system merely degrades. What matters is the worst-case execution time, not the average.

Rate-monotonic scheduling assigns static priority by frequency and is optimal among fixed-priority schemes. Earliest-deadline-first is dynamic and achieves full utilisation. Priority inversion, where a high-priority task waits on a resource held by a low-priority one, is addressed by priority inheritance.`,
            },
        ],
    },
    {
        file: 'mgt-financial-accounting.pdf',
        topic: 'Financial Accounting',
        title: 'Recording and Reporting Financial Position',
        subtitle: 'Course notes - Department of Management',
        sections: [
            {
                heading: '1. The accounting equation',
                body: `Assets equal liabilities plus equity, at every instant. Every transaction preserves this identity, which is what double-entry bookkeeping enforces mechanically.

Each entry has equal debits and credits. Debits increase assets and expenses; credits increase liabilities, equity and revenue. A trial balance that does not balance indicates an error, though balancing does not prove correctness.`,
            },
            {
                heading: '2. The accounting cycle',
                body: `Transactions are recorded in the journal, posted to ledger accounts, and summarised in a trial balance. Adjusting entries then record accruals, deferrals, depreciation and estimates before the statements are prepared.

Temporary accounts are closed to equity at period end so that revenue and expense measurement starts afresh, while balance sheet accounts carry forward.`,
            },
            {
                heading: '3. The financial statements',
                body: `The income statement reports performance over a period. The balance sheet reports position at an instant. The cash flow statement reconciles profit to cash movement across operating, investing and financing activities.

Profit and cash differ because of accrual accounting. A profitable business can fail from insufficient cash, which is why the cash flow statement is read alongside the others rather than after them.`,
            },
            {
                heading: '4. Accruals and matching',
                body: `Revenue is recognised when earned and expenses when incurred, not when cash moves. The matching principle pairs expenses with the revenue they generate, which is the basis of depreciation and of provisions for doubtful debts.

Depreciation allocates an asset's cost over its useful life. Straight-line spreads it evenly; reducing-balance charges more early. Neither attempts to track market value.`,
            },
            {
                heading: '5. Ratio analysis',
                body: `Liquidity ratios such as the current ratio assess short-term solvency. Profitability ratios such as return on equity assess performance relative to invested capital. Gearing ratios assess reliance on debt.

Ratios are comparative instruments: meaningful against the same firm over time or against industry peers, and largely meaningless in isolation.`,
            },
        ],
    },
    {
        file: 'mgt-strategic-management.pdf',
        topic: 'Strategic Management',
        title: 'Competitive Analysis and Strategy',
        subtitle: 'Course notes - Department of Management',
        sections: [
            {
                heading: '1. What strategy is',
                body: `Strategy is the choice of a distinctive position and the alignment of activities to sustain it. It is defined as much by what the organisation declines to do as by what it pursues.

Operational effectiveness - doing the same activities better - is necessary but imitable, and competition on it alone converges toward uniformity and eroded margins.`,
            },
            {
                heading: '2. Industry analysis',
                body: `The five forces frame industry profitability: rivalry among incumbents, threat of entrants, threat of substitutes, and the bargaining power of buyers and suppliers. Structure sets the average profitability a participant can expect.

Entry barriers - economies of scale, switching costs, network effects, regulation - determine how durable incumbent profits are.`,
            },
            {
                heading: '3. Internal analysis',
                body: `The resource-based view locates advantage in resources that are valuable, rare, hard to imitate and supported by the organisation. Tangible assets rarely qualify; capabilities and accumulated know-how more often do.

The value chain decomposes the firm into activities, distinguishing those that create differentiation from those that merely add cost.`,
            },
            {
                heading: '4. Generic strategies',
                body: `Cost leadership competes on efficiency and scale. Differentiation competes on attributes buyers will pay a premium for. Focus applies either logic to a narrow segment.

A firm attempting both broadly risks being stuck in the middle, carrying the cost base of differentiation without its pricing power. The exception is where a genuine innovation shifts the frontier rather than trading along it.`,
            },
            {
                heading: '5. Corporate strategy and execution',
                body: `Corporate strategy decides which businesses to be in. Diversification only creates value if the businesses are worth more together than apart, which is a demanding test that many acquisitions fail.

Execution is where strategy is usually lost. Structure, incentives and measurement have to reinforce the chosen position, because an incentive contradicting the strategy will reliably defeat it.`,
            },
        ],
    },
];

module.exports = { NOTES };
