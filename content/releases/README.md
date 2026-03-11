# Releases

审核通过的导入内容不会直接改写 `content/raw/`。

它们会在执行 release build 时被合并进课程宇宙，并把结果写入：

- `content/generated/`：正式可消费资产
- `content/releases/latest.json`：最新发布清单

## 发布

```bash
pnpm content:release-build
```
