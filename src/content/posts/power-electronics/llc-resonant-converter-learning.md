---
title: "LLC谐振变换器学习记录"
published: 2026-09-01
description: "用于验证博客文章、分类、标签、数学公式与 MATLAB 代码高亮的第一篇学习记录。"
tags: ["LLC", "谐振变换器", "电力电子"]
category: "电力电子"
draft: false
comment: false
---

这篇文章是博客的第一篇测试记录，用来确认 Markdown 内容、分类、标签、数学公式与代码块都能正常显示。

## 谐振频率

对由谐振电感 $L_r$ 和谐振电容 $C_r$ 组成的串联谐振网络，其谐振频率可以写为：

$$
f_r = \frac{1}{2\pi\sqrt{L_r C_r}}
$$

这个频率是后续分析 LLC 变换器工作区间和归一化频率的重要参考。

## MATLAB 计算示例

```matlab title="resonant_frequency.m"
Lr = 20e-6;      % 谐振电感，单位 H
Cr = 100e-9;     % 谐振电容，单位 F
fr = 1 / (2*pi*sqrt(Lr*Cr));

fprintf("谐振频率：%.2f kHz\n", fr / 1e3);
```

后续会继续补充增益曲线、软开关条件、器件参数选择和仿真结果。
