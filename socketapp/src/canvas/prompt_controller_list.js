import React from 'react'

class PromptControllerList extends React.Component{
    state={
        color_time: -1,
    }

    updatePromptColor(idx,e){
        
        this.props.mother_state.prompts[idx].color = e.target.value
        var _this = this
        this.props.mother_this.setState({}, function(){
            console.log(_this.props.palette)
            _this.props.palette.current.draw3DMix()
        })
        
        
    }


    updatePromptText(idx,e){
        this.props.mother_state.prompts[idx].prompt = e.target.value
        var el = document.getElementById('prompt_'+this.props.mother_state.prompts[idx]._id)
        el.style.height = 0
        el.style.height = (el.scrollHeight+1)+'px'
        this.props.mother_this.setState({})
    }

    addNewPrompt(idx, e){
        var prompt = {
            _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            prompt: '',
            color: "#"+Math.floor(Math.random()*16777215).toString(16),
            position: [Math.random(), Math.random()], 
            istext:true,
        }

        this.props.mother_state.prompts.push(prompt)
        this.props.mother_this.setState({})
    }

    deletePrompt(idx, e){
        
        for(var i=this.props.mother_state.prompt_groups.length-1; i>=0; i--){
            var prompt_group = this.props.mother_state.prompt_groups[i]
            if(prompt_group.indexOf(idx)!=-1){
                if(prompt_group.length==2){
                    this.props.mother_state.prompt_groups.splice(i, 1)
                    
                }else if(prompt_group.length==3){
                    console.log(this.props.mother_state.prompt_groups[i].indexOf(idx))
                    this.props.mother_state.prompt_groups[i].splice(this.props.mother_state.prompt_groups[i].indexOf(idx), 1)
                }
            }
            for(var j in this.props.mother_state.prompt_groups[i]){
                if(this.props.mother_state.prompt_groups[i][j]>idx){
                    this.props.mother_state.prompt_groups[i][j] = this.props.mother_state.prompt_groups[i][j] -1
                }
            }
        }
        var selected_prompt = this.props.mother_state.selected_prompt
        if(this.props.mother_state.selected_prompt!=undefined){
            if(this.props.mother_state.selected_prompt.prompts.indexOf(idx)!=-1){
                selected_prompt=undefined
            }
            else{
                for(var i in selected_prompt.prompts){
                    if(selected_prompt.prompts[i]>idx){
                        selected_prompt.prompts[i] = selected_prompt.prompts[i]-1
                    }
                }
            }
        }
        this.props.mother_state.prompts.splice(idx, 1)
        this.props.mother_this.setState({selected_prompt})
        this.setState({})
    }

    changePromptType(idx, e){
        this.props.mother_state.prompts[idx].istext = !this.props.mother_state.prompts[idx].istext
        this.props.mother_this.setState({})
    }

    renderTextPromptInput(val, idx, fontcolor){
        return (<div style={{flexGrow: 1}}>
            <textarea style={{color:fontcolor}} id={'prompt_'+val._id} className={'prompt_textarea'} value={val.prompt} onChange={this.updatePromptText.bind(this,idx)}></textarea>
        </div>)
    }

    colorMouseDown(val){
        this.setState({color_time:Date.now()})
        // var _this = this
        // setTimeout(function(){
        //     if(_this.state.color_down){
        //         document.getElementById('prompt_color_'+val._id).disabled=false
        //     }
        // }, 1000)
    }

    colorMouseUp(val){
        if(Date.now()-this.state.color_time<500){
            console.log('blue')
            document.getElementById('prompt_color_'+val._id).disabled=true
            var _this = this
            setTimeout(function(){
                    document.getElementById('prompt_color_'+val._id).disabled=false
            }, 10)
            // TODO select the prompt in the palette
        }
    }

    renderImagePromptInput(val, idx, fontcolor){
        
    }

    

    renderPromptList(){
        return this.props.mother_state.prompts.map((val, idx)=>{

            var fontcolor='white'
            if(this.props.mother_state.selected_prompt!=undefined){
                if(this.props.mother_state.selected_prompt.prompts.indexOf(idx)!=-1){
                    fontcolor = '#32cf7d'
                }
            }
            
            return (<div style={{display:'flex', marginTop: 5, marginRight:3}}>
                <div style={{marginRight:5}} className={'prompt_color'}>
                    <input type='color' id={'prompt_color_'+val._id} value={val.color} style={{borderRadius:9, width:18, height:18, border:'solid 0px transparent'}} 
                    onChange={this.updatePromptColor.bind(this, idx)} onPointerDown={this.colorMouseDown.bind(this, val)} onPointerUp={this.colorMouseUp.bind(this, val)}></input>
                </div>
                {val.istext && this.renderTextPromptInput(val, idx, fontcolor)}
                {!val.istext && this.renderImagePromptInput(val, idx, fontcolor)}
                
                <div className={'btn'} style={{height: 18, width: 24, padding: 0, lineHeight:'18px', marginLeft: 3}} onPointerDown={this.changePromptType.bind(this, idx)}>
                    {val.istext && <i class="fa fa-comment" style={{fontSize:16}} ></i>}
                    {!val.istext && <i class="fa fa-image" style={{fontSize:16}} ></i>}
                </div>
                <div className={'btn red'} style={{height: 18, width: 30, padding: 0, lineHeight:'18px', marginLeft: 3}} onPointerDown={this.deletePrompt.bind(this, idx)}>
                    X
                </div>
            </div>)
        })
    }

    render(){
        return (<div className={'prompt_list'}>
                <div style={{display:'flex'}}>
                    <div style={{marginRight: 10}}>Prompt List</div>
                    <div className={'btn'} style={{height: 20, width: 30, padding: 0, lineHeight:'20px'}} onPointerDown={this.addNewPrompt.bind(this)}>+</div>
                </div>
                <div style={{overflowY: 'auto', flexGrow: 1}}>
                    {this.renderPromptList()}            
                </div>
            </div>)
    }
}
export default PromptControllerList;