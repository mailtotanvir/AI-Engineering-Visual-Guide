# CUDA Programming Encyclopedia

---

## 1. Hardware Architecture (`hardware_architecture.md`)
- **Streaming Multiprocessors (SMs)**: Physical GPU cores, warp schedulers, and execution units.
- **SIMT Execution Model**: Single Instruction, Multiple Threads logic and execution pipelines.
- **Warp Scheduling**: Hardware instruction dispatch, dual-issue rules, and latency hiding.
- **Compute Capabilities**: Hardware generations, feature support, and architectural limits.

## 2. Thread Hierarchy (`thread_hierarchy.md`)
- **Grids, Blocks, and Threads**: Execution dimensions, resource limits, and hardware mapping.
- **Thread Indexing Formulas**: Linearizing 1D, 2D, and 3D coordinate spaces for data access.
- **Warp Divergence**: Impact of conditional branches and hardware execution masking.
- **Thread Synchronization**: Block-level barrier syncs and warp-level primitives.

## 3. Memory Management (`memory_management.md`)
- **Global Memory Coalescing**: Memory bus alignment, cache line sizes, and access patterns.
- **Shared Memory Banks**: Bank mapping configurations, conflict resolution, and broadcast modes.
- **Constant & Texture Memory**: Read-only caches, broadcast mechanics, and spatial locality.
- **Unified Memory Allocation**: Page faulting, prefetching, and page-migration engine mechanics.

## 4. Performance Optimization (`performance_optimization.md`)
- **Latency Hiding & Occupancy**: Active warps per SM, register pressure, and resource balancing.
- **Tiling via Shared Memory**: Staging global data to local memory to reduce memory traffic.
- **Instruction Throughput**: Fast math compiler flags, intrinsic functions, and loop unrolling.
- **Atomic Operations**: Hardware atomic units, memory contention, and lock-free execution.

## 5. Asynchronous CUDA (`asynchronous_cuda.md`)
- **CUDA Streams**: Concurrency queues, default stream blocking behavior, and stream priorities.
- **Asynchronous Memory Copies**: Pinned host memory requirements and overlapping compute with transfer.
- **CUDA Graphs**: Defining task dependencies, reducing launch overhead, and capturing stream activity.
- **Multi-GPU Communication**: Unified Virtual Addressing (UVA) and peer-to-peer (P2P) direct transfers.

## 6. Compilation & Tooling (`compilation_tooling.md`)
- **NVCC Compilation Pipeline**: Split compilation, device code generation, and host object linking.
- **PTX and SASS Assembly**: Intermediate virtual assembly vs machine-specific instruction sets.
- **Nsight Systems Profiling**: System-wide timeline analysis, CPU/GPU balance, and API overhead.
- **Nsight Compute Analysis**: Kernel-level profiling, instruction metrics, and roofline models.

## 7. Library Ecosystem (`library_ecosystem.md`)
- **cuBLAS**: Matrix operations, data layouts, and batched execution modes.
- **cuDNN**: Convolution algorithms, tensor core acceleration, and neural network primitives.
- **Thrust Template Library**: High-level parallel algorithms, host/device vectors, and iterators.
- **Host Language Bindings**: Integrating CUDA via Python (PyCUDA/CuPy) and foreign interfaces.
