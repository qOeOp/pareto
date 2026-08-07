# Classify Canonical Task Types

仅在以下任一 consumer 需要 task type 时加载本 reference：task workflow 正在创建或重新校验一个
packet；Hub dispatch 正在分类 approved node；lifecycle QA 正在按 type 聚合 terminal facts。普通
Mission、已冻结 title 的 child preflight、单 Mission recovery、delivery、agent routing 和 evaluator
不得为了读取 code table 加载它。

本文件是 canonical task type code、名称和职责边界的唯一 owner。Task workflow 仍独占 packet、
title、编号、consent、identity 和 dispatch；recovery 与 QA 只消费它投影出的 compact metadata。
不要复制 code list、legacy disposition 或分类规则到 consumer，也不要建立 alias map、registry、
ledger、scheduler、CLI 或 wrapper。

## Classify one primary owner domain

按 Outcome 的主要 consumer、owner 和 Acceptance 分类，而不是按动词、实现机制、文件名、历史
prefix、lane、model 或当前 lifecycle stage 分类。每个 task 恰有一个 canonical code；如果一个请求
包含多个可独立接受的主要 Outcome，先按 task workflow 判断是否应拆成多个 Mission。若两个 code
仍都可能成立，保持 packet `deferred` 并返回 main classification，不任选一个，也不创造临时代码。
当 Outcome 是可识别的普通 product、runtime、correctness、security fix 或 data/schema
implementation，且没有下表其他专门 domain 拥有主要 Acceptance 时，分类为 `DEV`；不能仅因它
包含“实现”或代码修改就使用 `DEV`。

所有 code 都固定为 ASCII 大写三字母。Allowed lifecycle role 中的 `primary` 表示只有可独立接受的
Mission Outcome 才能创建 task；planner、researcher、builder、evaluator、日常测试、QA routing、
delivery step 等内部工作继续留在其现有 Mission，不因 code 获得 task 身份。

| Code | Canonical name | Owner / domain boundary | Positive example | Negative example | Allowed lifecycle role |
| --- | --- | --- | --- | --- | --- |
| `ARC` | Architecture | 跨 owner 的结构、authority、dependency direction 与 cohesion；专门 domain 已拥有问题时让位给该 domain | 薄 lifecycle kernel、跨域 reference-tree cohesion | task identity/Hub DAG 属于 `ORC`；纯 latency 目标属于 `OPT` | `primary`；architecture advice 是内部 evidence |
| `DLV` | Delivery | PR、CI、provider review、merge、release handoff 与 exact-head delivery barrier | PR title contract、provider-review waiter、merged cleanup policy | evaluator admission 属于 `VER`；worktree 环境属于 `OPS` | `primary`；普通 publish/review/merge step 留在原 Mission |
| `DEV` | Product / Runtime Engineering | 普通 product、runtime、correctness、security-fix 或 data/schema implementation Outcome；仅在没有其他专门 canonical domain 拥有主要 Acceptance 时成立 | 新增用户功能、修复 runtime correctness/security 缺陷、实现 product data/schema change | research→`RSH`；planning→`PLN`；architecture→`ARC`；optimization→`OPT`；test governance→`TST`；verification→`VER`；QA→`QUA`；delivery→`DLV`；orchestration→`ORC`；environment operations→`OPS` | `primary`；普通实现步骤留在其专门 domain Mission，且 `DEV` 不是 implementation lifecycle stage |
| `OPS` | Operations | 本地或运行环境、worktree、toolchain 与 operational capability；不拥有 GitHub delivery lifecycle | managed-worktree environment/bootstrap contract | PR/merge effect 属于 `DLV`；Hub task topology 属于 `ORC` | `primary`；普通 deterministic bootstrap 是内部操作 |
| `OPT` | Optimization | 保持 Outcome 与 owner 不变时，以 latency、context、cost、throughput 或 efficiency 为主要 Acceptance | critical-path compression、empirical execution-route optimization | authority migration 属于 `ARC`；task dispatch correctness 属于 `ORC` | `primary`；route/model choice 本身仍由 routing owner 决定 |
| `ORC` | Orchestration | task identity/title/type、dispatch、Hub DAG、dependency release、monitoring、checkpoint recovery 与 portability | Hub DAG、single-Mission recovery、task-type authority | Plan decision policy 属于 `PLN`；generic environment 属于 `OPS` | `primary`；Hub controls 和 status work 不另建 task |
| `PLN` | Planning | Frame/Plan、decision evidence、Design Loop、representation admission 与 planning projection contract | Plan Design Loop、Frame/Plan projection contract | task recovery 属于 `ORC`；candidate audit 属于 `VER` | `primary`；`mission_planner` 是 support lane |
| `QUA` | Quality Assurance | 跨 lifecycle 的 mismatch 发现、分类、聚合、root-owner routing 与 corrosion assurance | lifecycle QA、RBM self-QA aggregation、owner corrosion routing | frozen-candidate audit 属于 `VER`；test governance 属于 `TST` | `primary`；普通 QA signal routing 不创建 task |
| `RSH` | Research | decision-changing evidence acquisition、research admission 与独立 research system；不拥有后续决策 | prior-art gate、domain-premise research contract | Plan choice 属于 `PLN`；固定 oracle audit 属于 `VER` | `primary`；`mission_researcher` 是 support lane |
| `TST` | Test Governance | test system、test policy、effectiveness、BDD/Step、fixture 或 Test GC 本身是主要交付物 | conditional test governance、test-effectiveness audit contract | 为其他 Mission 运行或补充测试仍属于原 Mission | `primary`；ordinary test/revise 是内部验证工作 |
| `VER` | Verification | 对 candidate、instruction、judge 或 evidence 的独立验证、evaluator/reviewer integrity 与 audit contract | evaluator packet/admission、independent Skill evaluation system | lifecycle aggregation 属于 `QUA`；provider delivery barrier 属于 `DLV` | `primary`；evaluator/reviewer support lane 不创建 task |

## Bound the legacy inventory

下表只处置本次 bounded inventory 中已经观察到的 historical facts；它不是 alias table。本 authority
canonical merge 前的 title、task identity、branch、PR 与 evidence 都是 `historical-only`，保持原字节，不 rename、
backfill 或重编号。`mapped` 表示同字面 code 可用于新的、重新分类后满足当前边界的 task；`merged`
表示旧同义 prefix 不再用于新 task；`retired` 表示该 prefix 描述机制或 component，无法稳定决定
domain，只有列出的既有实例得到本次 disposition。

| Observed prefix or exact group | Disposition | Canonical disposition for the observed Outcome |
| --- | --- | --- |
| `ARC` | `mapped` | `ARC` |
| `DLV` | `mapped` | `DLV` |
| `OPT` | `mapped` | `OPT` |
| `ORC` | `mapped` | `ORC` |
| `PLN` | `mapped` | `PLN` |
| `RSH` | `mapped` | `RSH` |
| `QA`, `PLAY` | `merged` | `QUA` |
| `ASM`, `SQA` | `merged` | observed assessment-rubric, evaluator admission, containment and terminal-integrity Outcomes → `VER` |
| `TEST` | `merged` | `TST` |
| `PERF`, `EFF`, `SPK` | `merged` | `OPT` |
| `VFY`, `VRY`, `EVAL`, `SKR` | `merged` | `VER` |
| `PRV`, `PR`, `CLN` | `merged` | `DLV` |
| `NAM`, `SGL`, `TYP`, `PRT` | `merged` | `ORC` |
| `RPL`, `FRM` | `merged` | `PLN` |
| `KRN`, `COH` | `merged` | `ARC` |
| `RES` | `merged` | `RSH` |
| `WT` | `merged` | `OPS` |
| `ORG` | `retired` | observed Skill organization/cohesion work → `ARC`; reviewer-transition work → `VER` |
| `RBM` | `retired` | observed evaluator/evidence integrity → `VER`; session/lifecycle orchestration → `ORC`; importer/test-audit → `TST`; review waiter/terminal → `DLV`; Plan capability/impact evidence → `PLN`; structural kernel/transition contract → `ARC` |
| `HLP` | `retired` | observed unsupported-import/test helper → `TST`; evaluator binding/packet helpers → `VER` |
| `HOOK` | `retired` | observed host lifecycle capability reachability/no-change probe → `OPS` |
| `REF` | `retired` | observed Git-history efficiency refactor → `OPT` |

不从上表推断未列出的 task，也不从 legacy prefix 直接生成 metadata。恢复 historical task 时保留
exact title/identity；只有当前 main 能根据现行 Frame、Outcome、owner 与 Acceptance 重新分类。

## Project metadata without policy

Task workflow 在成功分类后投影 code、canonical name、本文件的 exact revision locator 与一句
Outcome/owner basis。Consumer 只保留这份 compact projection；不得复制 table 或重跑 legacy
mapping。Task type 可以作为 QA aggregation、telemetry 或后续 routing research 的非授权 metadata
hook，但它单独不得决定 lane、model、reasoning effort、priority、dependency、lifecycle route、
verdict、repair owner 或 effect。

缺失、非三字母、非 member、证据不足以识别 owner domain、同一 Outcome 仍有多个 owner 竞争、
authority locator 漂移或 consumer 不认识的值都按 `unknown` fail-close：保留原始值与 locator，
冻结 type-dependent create/dispatch 或 aggregation claim，并返回 main classification。已有充分证据
表明主要 Outcome 是普通 product/runtime/correctness/security-fix/data/schema implementation 时
必须分类为 `DEV`，不得永久 defer；但也不要把 `DEV`、`GEN`、`MISC`、最相近 code 或历史 prefix
用作真正 unknown 的兜底。

新增 code 只能在当前 main 的独立 Plan 中完成：证明现有 code 都不匹配、拟议 code 与每个邻接
边界互斥、存在真实 creation/dispatch 或 QA consumer、给出正反例与 allowed lifecycle role，并在
同一 authority change 中更新本表并重新运行真实 consumer probes。依赖该新 code 的 task 在 canonical
authority merge 前保持 `deferred`。
