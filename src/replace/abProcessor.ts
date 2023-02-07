/** 基于接口写的扩展处理器的文件
 * 
 */

import {MarkdownRenderChild, MarkdownRenderer} from 'obsidian';
import {ABReg} from "src/config/abReg"
import ListProcess from "./listProcess"
import {getID} from "src/utils/utils"

import mermaid from "mermaid"
import mindmap from '@mermaid-js/mermaid-mindmap';
const initialize = mermaid.registerExternalDiagrams([mindmap]);
export const mermaid_init = async () => {
  await initialize;
};

/*export const list_option = {
  "other": "其他格式",
  "list2table": "表格",
  "list2mdtable": "表格(md)",
  "list2lt": "列表格",
  "list2mdlt": "列表格(md)",
  "list2ut": "ul表格",
  "list2mdut": "ul表格(md)",
  "list2mermaid": "流程图",
  "md": "原格式",
  "text": "纯文本",
  "Xcode": "消除代码块",
  "Xquote": "消除引用块",
  "code": "代码块",
  "quote": "引用块",
}*/

// 可以从设置中刷新，然后看到内部加外部所有的注册项
// id
// name
// detail?: 简单效果描述
// match: Reg|string（string区分大小写）
// is_render
//
// 非手写项：
// ~~is_inner：这个不可设置，用来区分是内部还是外部给的~~
// from: 自带、其他插件、面板设置，如果是其他插件，则需要提供插件的名称（不知道能不能自动识别）
// is_enable: 加载后能禁用这个项




/** 自动寻找相匹配的ab处理器进行处理
 * ab处理器能根据header和content来转化文本或生成dom元素
 */
export function autoABProcessor(el:HTMLDivElement, header:string, content:string):HTMLElement{
  // 用新变量代替 header 和 content
  const list_header = header.split("|")
  let result:HTMLElement|string = content
  // 循环header组，直到遍历完文本处理器或遇到渲染处理器
  for (let item_header of list_header){
    if (typeof(result)!="string") break
    const str_result:string = result
    for (let abReplaceProcessor of list_abProcessor){
      // 如果不匹配则跳过
      if (typeof(abReplaceProcessor.match)=='string'){if (abReplaceProcessor.match!=item_header) continue}
      else {if (!abReplaceProcessor.match.test(item_header)) continue}
      result = abReplaceProcessor.process(el, item_header, str_result)
    }
  }
  // 如果header组里没用渲染处理器，那么给一个md处理器
  if (typeof(result)=="string") {
    const child = new MarkdownRenderChild(el);
    MarkdownRenderer.renderMarkdown(result, el, "", child);
    result = el
  }
  return result
}
/** 获取id-name对，以创建下拉框
 * 注意如果有正则的话，不能给
 */
export function getProcessorOptions(){
  return list_abProcessor
  .filter(item=>{
    return typeof(item.match)=="string"
  })
  .map(item=>{
    return {id:item.id, name:item.name}
  })
}

/** 注册ab处理器。
 * 不允许直接写严格版的，有些参数不能让用户填
 */
function registerABProcessor(sim: ABProcessorSpecSimp){
  const abProcessorSpec:ABProcessorSpec = {
    id: sim.id,
    name: sim.name,
    match: sim.match?sim.match:sim.id,
    detail: sim.detail??"",
    is_render: sim.is_render??true,
    process: sim.process,
    is_disable: false
  }
  list_abProcessor.push(abProcessorSpec)
}
/** ab处理器列表 */
let list_abProcessor: ABProcessorSpec[] = []
/** ab处理器接口 - 语法糖版 */
interface ABProcessorSpecSimp{
  id: string            // 唯一标识
  name: string          // 处理器名字
  match?: RegExp|string // 处理器匹配正则（不填则为id，而不是name！name可以被翻译或是重复的）如果填写了且为正则类型，不会显示在下拉框中
  detail?: string       // 处理器描述
  is_render?: boolean   // 是否渲染处理器，默认为true。false则为文本处理器
  process: (el:HTMLDivElement, header:string, content:string)=> HTMLElement|string
                        // 处理器
}
/** ab处理器接口 - 严格版 */
interface ABProcessorSpec{
  id: string
  name: string
  match: RegExp|string
  detail: string
  is_render: boolean
  process: (el:HTMLDivElement, header:string, content:string)=> HTMLElement|string
  is_disable: boolean   // 是否禁用，默认false
}

registerABProcessor({
  id: "md",
  name: "md",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    // ctx.addChild(child);
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "hide",
  name: "默认折叠",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    content = text_quote("[!note]-\n"+content)
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

// 可折叠（借callout）
registerABProcessor({
  id: "flod",
  name: "可折叠的",
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    content = text_quote("[!note]+\n"+content)
    MarkdownRenderer.renderMarkdown(content, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "quote",
  name: "增加引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_quote(content)
  }
})

registerABProcessor({
  id: "code",
  name: "增加代码块",
  is_render: false,
  process: (el, header, content)=>{
    return text_code(content)
  }
})

registerABProcessor({
  id: "Xquote",
  name: "去除引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_Xquote(content)
  }
})

registerABProcessor({
  id: "Xcode",
  name: "去除代码块",
  is_render: false,
  process: (el, header, content)=>{
    return text_Xcode(content)
  }
})

registerABProcessor({
  id: "X",
  name: "去除代码或引用块",
  is_render: false,
  process: (el, header, content)=>{
    return text_X(content)
  }
})

registerABProcessor({
  id: "code2quote",
  name: "代码转引用块",
  is_render: false,
  process: (el, header, content)=>{
    content = text_Xcode(content)
    content = text_quote(content)
    return content
  }
})

registerABProcessor({
  id: "quote2code",
  name: "引用转代码块",
  is_render: false,
  process: (el, header, content)=>{
    content = text_Xquote(content)
    content = text_code(content)
    return content
  }
})

registerABProcessor({
  id: "slice",
  name: "切片",
  match: /^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/,
  is_render: false,
  process: (el, header, content)=>{
    // slice好像不怕溢出或交错，会自动变空数组。就很省心，不用判断太多的东西
    const list_match = header.match(/^slice\((\s*\d+\s*)(,\s*-?\d+\s*)?\)$/)
    if (!list_match) return content
    const arg1 = Number(list_match[1].trim())
    if (isNaN(arg1)) return content
    const arg2 = Number(list_match[2].replace(",","").trim())
    // 单参数
    if (isNaN(arg2)) {
      return content.split("\n").slice(arg1).join("\n")
    }
    // 双参数
    else {
      return content.split("\n").slice(arg1, arg2).join("\n")
    }
  }
})

registerABProcessor({
  id: "title2list",
  name: "标题到列表",
  is_render: false,
  process: (el, header, content)=>{
    content = ListProcess.title2list(content, el)
    return content
  }
})

registerABProcessor({
  id: "title2table",
  name: "标题到表格",
  is_render: false,
  process: (el, header, content)=>{
    ListProcess.title2table(content, el)
    return content
  }
})

registerABProcessor({
  id: "title2mindmap",
  name: "标题到脑图",
  is_render: false,
  process: (el, header, content)=>{
    ListProcess.title2mindmap(content, el)
    return content
  }
})

registerABProcessor({
  id: "listroot",
  name: "增加列表根",
  match: /^listroot\((.*)\)$/,
  is_render: false,
  process: (el, header, content)=>{
    const list_match = header.match(/^listroot\((.*)\)$/)
    if (!list_match) return content
    const arg1 = list_match[1].trim()
    content = content.split("\n").map(line=>{return "  "+line}).join("\n")
    content = "- "+arg1+"\n"+content
    return content
  }
})

registerABProcessor({
  id: "list2table",
  name: "列表转表格",
  process: (el, header, content)=>{
    ListProcess.list2table(content, el, false)
    return el
  }
})

registerABProcessor({
  id: "list2mdtable",
  name: "列表转表格(md)",
  process: (el, header, content)=>{
    ListProcess.list2table(content, el, true)
    return el
  }
})

registerABProcessor({
  id: "list2lt",
  name: "列表转列表表格",
  process: (el, header, content)=>{
    ListProcess.list2lt(content, el, false)
    return el
  }
})

registerABProcessor({
  id: "list2mdlt",
  name: "列表转列表表格(md)",
  process: (el, header, content)=>{
    ListProcess.list2lt(content, el, true)
    return el
  }
})

registerABProcessor({
  id: "list2ut",
  name: "列表转二维表格",
  process: (el, header, content)=>{
    ListProcess.list2ut(content, el, false)
    return el
  }
})

registerABProcessor({
  id: "list2mdut",
  name: "列表转二维表格(md)",
  process: (el, header, content)=>{
    ListProcess.list2ut(content, el, true)
    return el
  }
})

registerABProcessor({
  id: "list2mermaid",
  name: "列表转mermaid流程图",
  process: (el, header, content)=>{
    ListProcess.list2mermaid(content, el)
    return el
  }
})

registerABProcessor({
  id: "list2mindmap",
  name: "列表转mermaid思维导图",
  process: (el, header, content)=>{
    ListProcess.list2mindmap(content, el)
    return el
  }
})

registerABProcessor({
  id: "callout",
  name: "callout语法糖",
  match: /^\!/,
  process: (el, header, content)=>{
    const child = new MarkdownRenderChild(el);
    const text = "```ad-"+header.slice(1)+"\n"+content+"\n```"
    MarkdownRenderer.renderMarkdown(text, el, "", child);
    return el
  }
})

registerABProcessor({
  id: "mermaid",
  name: "新mermaid",
  process: (el, header, content)=>{
    // asyncMermaid(el, header, content)
    (async (el:HTMLDivElement, header:string, content:string)=>{
      await mermaid_init()
      await mermaid.mermaidAPI.renderAsync("ab-mermaid-"+getID(), content, (svgCode: string)=>{
        el.innerHTML = svgCode
      });
    })(el, header, content)
    return el
  }
})

registerABProcessor({
  id: "text",
  name: "纯文本",
  process: (el, header, content)=>{
    el.addClasses(["ab-replace", "cm-embed-block", "markdown-rendered", "show-indentation-guide"])
    // 文本元素。pre不好用，这里还是得用<br>换行最好
    // `<p>${content.split("\n").map(line=>{return "<span>"+line+"</span>"}).join("<br/>")}</p>`
    el.innerHTML = `<p>${content.replace(/ /g, "&nbsp;").split("\n").join("<br/>")}</p>`
    return el
  }
})

/** 5个文本处理脚本 */

function text_X(content:string): string{
  let flag = ""
  for (let line of content.split("\n")){
    if (ABReg.reg_code.test(line)) {flag="code";break}
    else if (ABReg.reg_quote.test(line)) {flag="quote";break}
  }
  if (flag=="code") return text_Xcode(content)
  else if (flag=="quote") return text_Xquote(content)
  return content
}

function text_quote(content:string): string{
  return content.split("\n").map((line)=>{return "> "+line}).join("\n")
}

function text_Xquote(content:string): string{
  return content.split("\n").map(line=>{
    return line.replace(/^>\s/, "")
  }).join("\n")
}

// （第一行不加入代码符） @todo
function text_code(content:string): string{
  return "```\n"+content+"\n```"
}

// （仅去除第一组，且会去掉代码符，后续更新加入可以保留代码符的选项）
function text_Xcode(content:string): string{
  let list_content = content.split("\n")
  let code_flag = ""
  let line_start = -1
  let line_end = -1
  for (let i=0; i<list_content.length; i++){
    if (code_flag==""){     // 寻找开始标志
      const match_tmp = list_content[i].match(ABReg.reg_code)
      if(match_tmp){
        code_flag = match_tmp[1]
        line_start = i
      }
    }
    else {                  // 寻找结束标志
      if(list_content[i].indexOf(code_flag)>=0){
        line_end = i
        break
      }
    }
  }
  if(line_start>=0 && line_end>0) { // 避免有头无尾的情况
    list_content[line_start] = list_content[line_start].replace(/^```(.*)$|^~~~(.*)$/, "")  // 还是把代码符给删了吧
    list_content[line_end] = list_content[line_end].replace(/^```|^~~~/, "")
    content = list_content.join("\n")//.trim()
  }
  return content
}