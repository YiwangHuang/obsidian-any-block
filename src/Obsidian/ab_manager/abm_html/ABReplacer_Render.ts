import { MarkdownRenderChild } from "obsidian";
import { ABReplacer_Widget } from "../abm_cm/ABReplacer_Widget";
import { ABConvertManager } from "@/ABConverter/ABConvertManager"
import { abConvertEvent } from "@/ABConverter/ABConvertEvent";

export class ABReplacer_Render extends MarkdownRenderChild {
  content: string;
  header: string;
  selectorName: string;

  // 构造函数，override。这里就是新增了一个text参数而已，其他不变
  constructor(containerEl: HTMLElement, header: string, content: string, selectorName: string = "replacer_default") {
    super(containerEl);
    this.header = header;
    this.content = content;
    this.selectorName = selectorName;
  }

  /**
   *  div
   *      div.ab-replace.cm-embed-block.markdown-rendered.show-indentation-guide[type_header=`${}`]
   *          div.drop-shadow.ab-note
   *              .ab-replaceEl (下拉框选择时被替换)
   *          div.edit-block-button[aria-label="Edit this block"]
   * 
   *  this.containerEl
   *      div
   *          dom_note
   *              subEl (下拉框选择时被替换)
   *          dom_edit
   */
  onload() {
    const div:HTMLDivElement = this.containerEl.createDiv({
      cls: ["ab-replace", "cm-embed-block"]
    });
    div.setAttribute("type_header", this.header)

    // AnyBlock主体部分
    const dom_note = div.createDiv({
      cls: ["ab-note", "drop-shadow"]
    })
    let dom_replaceEl = dom_note.createDiv({
      cls: ["ab-replaceEl"]
    })
    ABConvertManager.autoABConvert(dom_replaceEl, this.header, this.content, this.selectorName)
    this.containerEl.replaceWith(div);
    
    // 刷新按钮部分
    let dom_edit2 = div.createEl("div", {
      cls: ["ab-button", "ab-button-1", "edit-block-button"],
      attr: {"aria-label": "Refresh the block"}
    });
    dom_edit2.insertAdjacentHTML("beforeend", ABReplacer_Widget.STR_ICON_REFRESH)
    dom_edit2.onclick = ()=>{abConvertEvent(div)}

    // 下拉框格式部分
    const dom_edit = div.createEl("div", {
      cls: ["ab-button", "ab-button-2", "edit-block-button", "ab-button-select"],
    })
    const dom_edit_mask = dom_edit.createEl("button", {}) // 遮挡select元素的, text: "v"
    dom_edit_mask.insertAdjacentHTML("beforeend", `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down"><path d="m6 9 6 6 6-6"/></svg>`)
    const dom_edit_select = dom_edit.createEl("select", {
      attr: {"aria-label": "Change the block - "+this.header}
    });
    const first_dom_option = dom_edit_select.createEl("option",{ // 这个需要在首选
      text: "复合格式:"+this.header,
      attr: {"value": this.header, "title": this.header},
    })
    first_dom_option.selected=true
    let header_name_flag = ""   // 当前填写的处理器是否标准处理器，如过则隐藏第一个option改用标准的那个
    for (let item of ABConvertManager.getInstance().getConvertOptions()){
      const dom_option = dom_edit_select.createEl("option",{
        text:item.name,
        attr:{"value":item.id},
      })
      if (this.header==item.id) {
        header_name_flag = item.name
        // dom_option.selected=true
      }
    }
    if (header_name_flag!=""){ // 这里可选一种处理方式：销毁/隐藏/不处理 保留两个相同规则的选项
      // first_dom_option.setAttribute("style", "display:none") 
      // dom_edit.removeChild(first_dom_option)
      first_dom_option.setText(header_name_flag)
    }
    dom_edit_select.onchange = ()=>{
      const new_header = dom_edit_select.options[dom_edit_select.selectedIndex].value
      const new_dom_replaceEl = dom_note.createDiv({
        cls: ["ab-replaceEl"]
      })
      ABConvertManager.autoABConvert(new_dom_replaceEl, new_header, this.content, this.selectorName)
      dom_replaceEl.replaceWith(new_dom_replaceEl);
      dom_replaceEl = new_dom_replaceEl
    }

    // 控件部分的隐藏
    const button_show = ()=>{dom_edit.show(); dom_edit2.show()}
    const button_hide  = ()=>{dom_edit.hide(); dom_edit2.hide()}
    button_hide()
    dom_note.onmouseover = button_show
    dom_note.onmouseout = button_hide
    dom_edit.onmouseover = button_show
    dom_edit.onmouseout = button_hide
    dom_edit2.onmouseover = button_show
    dom_edit2.onmouseout = button_hide
  }

  static str_icon_code2 = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-darkreader-inline-stroke="" style="--darkreader-inline-stroke:currentColor;"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>`
}
