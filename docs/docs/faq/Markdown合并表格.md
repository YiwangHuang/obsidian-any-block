---
create_time: 2025-05-29
Author: LincZero
---
# Markdown如何合并表格?

很多人问过，我也重复回答过很多次

## 扩展位置

首先我们来看扩展类型着手点：

- 直接html语法
- vuepress插件 / 其他框架的插件
- markdown渲染引擎：markdown-it插件 / 非markdown-it体系的扩展（如remark）

## (1) html方案

不过手写html……并不推荐

想编辑输入些，可以用一些在线网页（可以自行搜索，不少），如 https://www.tablesgenerator.com/html_tables 。网站可以可视化编辑 (excel)，且能合并单元格，并输出markdown/html等。有的还可以把html黏贴回去继续编辑。

选用：

适合写得不频繁且不维护的。

一般不是很推荐，除非环境受限，不能用太复杂的markdown框架。或历史遗留问题很多东西不能换，不能换用框架/框架不能使用扩展

## (2) markdown-it-multimd-table / obsidian-table-extend

经典的 markdown-it 插件的表格合并单元格插件

相关链接:

- [插件的 github repo](https://github.com/redbug312/markdown-it-multimd-table)
- [插件的 npmjs](https://www.npmjs.com/package/markdown-it-multimd-table)
- [obsidian 的插件版本](https://github.com/aidenlx/table-extended)

缺点：

- 一是很久没更新了
- 二是语法非常别扭，语法设计存在问题，**完全放弃对markwon的向下兼容**。下面来吐槽几个语法：

### 一是合并表格的表示

该语法用两个紧挨着的 `|` 来表示左右合并，用 `^^` 来表示向上合并。其中一旦使用了左右合并，**该内容无法被markdown识别为表格，无插件环境下无法被渲染为表格**

```md
| 1 | 2 |
|---|---|
| a ||
| ^^||
```

应改为类型这样的语法：

```md
| 1 | 2 |
|---|---|
| a | < |
| ^ | < |
```

(如要兼容原行为，使用 `\<` 或 `\^` 就好)
(该内容在无插件环境下，依然能看出这是一个合并表格的标志，**并不损失阅读信息量**)

### 二是无表头的表示

不写表格第一行。**该内容无法被markdown识别为表格，无插件环境下无法被渲染为表格**

```md
|---|---|
| a | b |
| c | d |
```

应改为类型这样的语法：

```md
| _ | _ |
|---|---|
| a | b |
| c | d |
```

(`-` 符号可设计成其他符号。如要兼容原行为，使用 `\-` 就好)
(该内容在无插件环境下，依然能看出这是一个不写表头的表示，**并不损失阅读信息量**)

### 三是包含多行内容的表示

这个更是重量级，用 `\` 来表示多行内容。**该内容无法被markdown识别为表格，无插件环境下无法被渲染为表格**，并且还有可能以一个非常丑陋的状态显示

```md
| 1       | 2 |
|---------|---|
|```js    | a   \
|var a = 0|     \
|```      |   |
```

### 总结

我认为 markdown-it-table-extend 的语法设计相当糟糕，完全不考虑向下兼容问题。十分不推荐

并且对此，提出了许多语法设计建议。

> [!note]
> 新语法的通用性
> 
> obsidian的Sheets Extended，仓库 [obsidan-advanced-table-xt](https://github.com/NicoNekoru/obsidan-advanced-table-xt)。以及obsidian/markdown-it通用插件的 [any-block](https://github.com/any-block/any-block) 的 exTable 处理器。均使用了设计更加合理的语法，这两的语法差不多，通用的
> 
> 其中 obsidian sheets extended 更适用于只使用 obsidian 的用户，由于他们的语法相似，下面只介绍 AnyBlock 的 exTable
<!--  -->
## (3) AnyBlock 的 exTable

使用了前文提到markdown-it-table-extend的语法改良方案，提高了兼容性

使用 `<` 和 `^` 来表示表格的合并。**简单快捷、书写性好、兼容性好、无插件状态下显示的可理解性高**

示例：

```md
[exTable]

| 1   | 2   | a   |
| --- | --- | --- |
| 3   | <   | b   |
| ^   | <   | c   |
```

效果：

[exTable]

| 1   | 2   | a   |
| --- | --- | --- |
| 3   | <   | b   |
| ^   | <   | c   |

你可以不安装就能在线体验，以判断该扩展是否适合你: https://any-block.github.io/any-block/ (左上下拉框切换到 "扩展表格" 选项，即可查看对应的demo)

## (4) AnyBlock 的 list2table

使用的并非markdown表格的语法，而是markdown的列表语法，并可以通过简单的声明，将列表转换成表格。

适用于多叉表格 (并不支持左右合并，只支持树形结构的上下合并)。**简单快捷、书写性好、兼容性好、无插件状态下显示的可理解性高**

示例：

:::mditABDemo

[table]

- 1
  - 2
  - 3
    - 4
    - 5
- 6
  - 7
  - 8

:::
