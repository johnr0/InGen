import React from 'react'
import {create, all} from 'mathjs'
import M from 'materialize-css'

class PromptControllerPalette extends React.Component{

    state={
        action:'idle',
        control_action: 'idle',
        step: 40,
        current_prompt: -1,
        palette_fix: false,
    }

    componentDidMount(){
        this.math = create(all, {})
        var _this = this
        setTimeout(function(){
            _this.draw3DMix()
        },50)
    }

    componentDidUpdate(){
        if(this.state.current_prompt!=-1){
            var activate = false
            for(var i in this.props.mother_state.prompt_groups){
                if(this.props.mother_state.prompt_groups[i].indexOf(this.state.current_prompt)!=-1 &&this.props.mother_state.prompt_groups[i].length==3){
                    activate=true
                }
            }
            if(activate){
                this.draw3DMix()
            }   
            
        }
        

    
    }

    setSinglePrompt(idx){
        var selected_prompt={
            position: this.props.mother_state.prompts[idx].position,
            prompts: [idx],
            weights: [1],
        }
        this.props.mother_this.setState({selected_prompt:selected_prompt})
    }

    setDoublePrompt(val, idx, e){
        var prompt1 = this.props.mother_state.prompts[val[0]]
        var prompt2 = this.props.mother_state.prompts[val[1]]

        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_x = palette_el.getBoundingClientRect().x
        var palette_y = palette_el.getBoundingClientRect().y
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height

        var x = e.pageX-palette_x
        var y = e.pageY-palette_y

        var x1 = prompt1.position[0] * palette_width
        var y1 = prompt1.position[1] * palette_height

        var x2 = prompt2.position[0] * palette_width
        var y2 = prompt2.position[1] * palette_height

        var len1 = Math.sqrt((x1-x)*(x1-x) + (y1-y)*(y1-y))
        var len2 = Math.sqrt((x2-x)*(x2-x) + (y2-y)*(y2-y))
        
        var w1 = len2/(len1+len2)
        var w2 = len1/(len1+len2)
        var selected_prompt={
            position: [x/palette_width, y/palette_height],
            prompts: [val[0], val[1]],
            weights: [w1, w2],
        }
        this.props.mother_this.setState({selected_prompt:selected_prompt})
        this.setState({})
    }

    setTriplePrompt(val, idx, e){
        var prompt1 = this.props.mother_state.prompts[val[0]]
        var prompt2 = this.props.mother_state.prompts[val[1]]
        var prompt3 = this.props.mother_state.prompts[val[2]]

        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_x = palette_el.getBoundingClientRect().x
        var palette_y = palette_el.getBoundingClientRect().y
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height

        var x = e.pageX-palette_x
        var y = e.pageY-palette_y

        var x1 = prompt1.position[0] * palette_width
        var y1 = prompt1.position[1] * palette_height

        var x2 = prompt2.position[0] * palette_width
        var y2 = prompt2.position[1] * palette_height

        var x3 = prompt3.position[0] * palette_width
        var y3 = prompt3.position[1] * palette_height

        var matmul_result = this.math.multiply(this.math.inv([[x1,x2,x3], [y1,y2,y3], [1,1,1]]), [x, y, 1])
        var selected_prompt={
            position: [x/palette_width, y/palette_height],
            prompts: [val[0], val[1], val[2]],
            weights: matmul_result,
        }
        this.props.mother_this.setState({selected_prompt:selected_prompt})
        this.setState({})

    }

    toggleFix(){
        this.setState({palette_fix:!this.state.palette_fix})
    }

    initMovePrompt(idx){
        console.log(this)
        if(this.state.palette_fix==false){
            this.setState({current_prompt: idx, action:'move_prompt'})
        }
        this.setSinglePrompt(idx)
        
    }

    downPointer(){
        this.setState({control_action:'control'})
    }

    movePointer(e){
        if(this.state.action=='move_prompt'){
            this.setSinglePrompt(this.state.current_prompt)
            this.movePrompt(e)
        }
    }

    endPointer(e){
        if(this.state.action=='move_prompt'){
            this.setState({action:'idle', current_prompt: -1})
        }
        this.setState({control_action:'idle'})
    }

    movePrompt(e){
        e.stopPropagation()
        var palette_el = document.getElementById('prompt_palette_board')
        var palette_x = palette_el.getBoundingClientRect().x
        var palette_y = palette_el.getBoundingClientRect().y
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height
        var x = (e.pageX-palette_x)/palette_width
        var y = (e.pageY-palette_y)/palette_height

        this.props.mother_state.prompts[this.state.current_prompt].position = [x, y]
        this.props.mother_this.setState({})
    }

    renderMix2(){
        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height
        return this.props.mother_state.prompt_groups.map((val, idx)=>{
            if(val.length==2){
                
                var prompt1 = this.props.mother_state.prompts[val[0]]
                var prompt2 = this.props.mother_state.prompts[val[1]]
                if(prompt1==undefined || prompt2==undefined){
                    return
                }
                var x = palette_width * prompt1.position[0]-20
                var y = palette_height * prompt1.position[1]
                var height = Math.sqrt(palette_width *palette_width *(prompt1.position[0]-prompt2.position[0])*(prompt1.position[0]-prompt2.position[0])+palette_height * palette_height *(prompt1.position[1]-prompt2.position[1])*(prompt1.position[1]-prompt2.position[1]))
                var angleDeg = -Math.atan2(palette_width *(prompt2.position[0] - prompt1.position[0]), palette_height *(prompt2.position[1] - prompt1.position[1])) * 180 / Math.PI;
                return (<g key={'mix2_'+idx}>
                    <defs>
                    <linearGradient id={"Gradient_"+idx} x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor={prompt1.color}/>
                        <stop offset="100%" stopColor={prompt2.color}/>
                    </linearGradient>
                    </defs>
                    <rect x={x} y={y} width={40} stroke={'white'} strokeWidth={2} fill={"url(#Gradient_"+idx+')'} height={height} 
                    style={{transformBox: 'fill-box', transformOrigin:'top center', transform: 'rotate('+angleDeg+'deg)'}}
                    onPointerEnter={this.mix2Enter.bind(this, val, idx)} onPointerDown={this.mix2Down.bind(this,val,idx)} 
                    onPointerMove={this.mix2Move.bind(this,val,idx)}></rect>
                </g>)
            }else{
                return
            }
        })
    }

    mix2Enter(val, idx, e){
        if(this.state.control_action=='control'){
            this.setDoublePrompt(val, idx, e)
        }
        this.combine3(val, idx)
    }

    mix2Down(val, idx, e){
        this.setDoublePrompt(val, idx, e)
    }

    mix2Move(val, idx, e){
        if(this.state.control_action=='control'){
            this.setDoublePrompt(val, idx, e)
        }

    }


    combine3(val, idx){
        if(this.state.current_prompt!=-1 && this.state.action=='move_prompt'){
            if(val.indexOf(this.state.current_prompt)==-1){
                this.props.mother_state.prompt_groups[idx].push(this.state.current_prompt)
                this.props.mother_this.setState({})
            }
        }
    }

    sign(p1, p2, p3){
        return (p1[0]-p3[0])*(p2[1]-p3[1])-(p2[0]-p3[0])*(p1[1]-p3[1]);
    }

    pointInTriangle(pt, v1, v2, v3){
        var d1 = this.sign(pt, v1, v2)
        var d2 = this.sign(pt, v2, v3)
        var d3 = this.sign(pt, v3, v1)

        var has_neg = (d1 < 0) || (d2 < 0) || (d3 < 0)
        var has_pos = (d1 > 0) || (d2 > 0) || (d3 > 0)

        return !(has_neg && has_pos)
    }

    interpolateColors(colors, amount) { 

        var rr=0, rg=0, rb=0

        for(var i in amount){
            var ah = +colors[i].replace('#', '0x'),
            ar = ah >> 16, ag = ah >> 8 & 0xff, ab = ah & 0xff
            rr = rr+ ar*amount[i] 
            rg = rg+ ag*amount[i]
            rb = rb+ ab*amount[i]
        }
    
        return '#' + ((1 << 24) + (rr << 16) + (rg << 8) + rb | 0).toString(16).slice(1);
    }

    draw3DMix(){
        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height

        return this.props.mother_state.prompt_groups.map((val, idx)=>{
            if(val.length==3){
                
                var canvas = document.getElementById('mix3_'+idx)
                if(canvas==null){
                    return
                }
                var ctx = canvas.getContext('2d')
                ctx.clearRect(0,0,palette_width, palette_height)

                var prompt1 = this.props.mother_state.prompts[val[0]]
                var prompt2 = this.props.mother_state.prompts[val[1]]
                var prompt3 = this.props.mother_state.prompts[val[2]]

                var x1 = palette_width * prompt1.position[0]
                var y1 = palette_height * prompt1.position[1]
                var x2 = palette_width * prompt2.position[0]
                var y2 = palette_height * prompt2.position[1]
                var x3 = palette_width * prompt3.position[0]
                var y3 = palette_height * prompt3.position[1]

                var xmin = Math.min(x1,x2,x3)
                var xmax = Math.max(x1,x2,x3)

                var ymin = Math.min(y1,y2,y3)
                var ymax = Math.max(y1,y2,y3)

                var step = 3

                var pixels = []
                for(var cur_x=xmin; cur_x<=xmax; cur_x=cur_x+step){
                    for(var cur_y=ymin; cur_y<=ymax; cur_y=cur_y+step){
                        pixels.push([cur_x, cur_y])
                    }
                }
                pixels.map((val, idx)=>{
                    var cur_x = val[0]
                    var cur_y = val[1]
                    if(this.pointInTriangle([cur_x, cur_y], [x1, y1], [x2, y2], [x3, y3])){
                            var matmul_result = this.math.multiply(this.math.inv([[x1,x2,x3], [y1,y2,y3], [1,1,1]]), [cur_x, cur_y, 1])
                            var f_color = this.interpolateColors([prompt1.color, prompt2.color, prompt3.color], matmul_result)
                            
                            ctx.fillStyle = f_color
                            ctx.fillRect(cur_x, cur_y, step, step)
                        }
                })

            }

        })
    }

    renderMix3_canvas(){
        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height
        return this.props.mother_state.prompt_groups.map((val, idx)=>{
            if(val.length==3){
                return (<canvas style={{position:'absolute', left:0, zIndex:-1}} width={palette_width} height={palette_height} key={'mix3_'+idx} id={'mix3_'+idx}>
                </canvas>)
            }
        })
    }

    renderMix3(){
        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height
        return this.props.mother_state.prompt_groups.map((val, idx)=>{
            if(val.length==3){
                var prompt1 = this.props.mother_state.prompts[val[0]]
                var prompt2 = this.props.mother_state.prompts[val[1]]
                var prompt3 = this.props.mother_state.prompts[val[2]]

                var x1 = palette_width * prompt1.position[0]
                var y1 = palette_height * prompt1.position[1]
                var x2 = palette_width * prompt2.position[0]
                var y2 = palette_height * prompt2.position[1]
                var x3 = palette_width * prompt3.position[0]
                var y3 = palette_height * prompt3.position[1]

                var points = x1+','+y1+' '+x2+','+y2+' '+x3+','+y3
                
                return (<g>
                    <polygon points={points} stroke='white' strokeWidth='2px' fill='transparent'
                    onPointerDown={this.mix3Down.bind(this, val, idx)} onPointerEnter={this.mix3Enter.bind(this, val, idx)} onPointerMove={this.mix3Move.bind(this, val, idx)}></polygon>
                </g>)
            }
        })
    }

    mix3Down(val, idx, e){
        this.setTriplePrompt(val, idx, e)
    }

    mix3Enter(val, idx, e){
        if(this.state.control_action=='control'){
            this.setTriplePrompt(val, idx, e)
        }
    }

    mix3Move(val, idx, e){
        if(this.state.control_action=='control'){
            this.setTriplePrompt(val, idx, e)
        }
    }

    renderMix3_2(){
        var palette_el = document.getElementById('prompt_palette_board')
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height
        return this.props.mother_state.prompt_groups.map((val, idx)=>{
            if(val.length==3){
                var step = parseInt(palette_width/this.state.step)
                var rendered = []
                var prompt1 = this.props.mother_state.prompts[val[0]]
                var prompt2 = this.props.mother_state.prompts[val[1]]
                var prompt3 = this.props.mother_state.prompts[val[2]]
                var x1 = palette_width * prompt1.position[0]
                var y1 = palette_height * prompt1.position[1]
                var x2 = palette_width * prompt2.position[0]
                var y2 = palette_height * prompt2.position[1]
                var x3 = palette_width * prompt3.position[0]
                var y3 = palette_height * prompt3.position[1]

                var xmin = Math.min(x1,x2,x3)
                var xmax = Math.max(x1,x2,x3)

                var ymin = Math.min(y1,y2,y3)
                var ymax = Math.max(y1,y2,y3)

                for(var cur_x=xmin; cur_x<=xmax; cur_x=cur_x+step){
                    for(var cur_y=ymin; cur_y<=ymax; cur_y=cur_y+step){
                        rendered.push([cur_x, cur_y])
                        // console.log(this.pointInTriangle([cur_x, cur_y], [x1, y1], [x2, y2], [x3, y3]))
                        
                    }
                }

                return rendered.map((val2, idx2)=>{
                    var cur_x = val2[0]
                    var cur_y = val2[1]
                    if(this.pointInTriangle([cur_x, cur_y], [x1, y1], [x2, y2], [x3, y3])){
                        var matmul_result = this.math.multiply(this.math.inv([[x1,x2,x3], [y1,y2,y3], [1,1,1]]), [cur_x, cur_y, 1])
                        var f_color = this.interpolateColors([prompt1.color, prompt2.color, prompt3.color], matmul_result)
                        return <rect x={cur_x-step/2} y={cur_y-step/2} width={step-2} height={step-2} fill={f_color}></rect>
                    }
                })

            }
        })
    }


    promptEnter(idx, e){
        if(this.state.control_action=='control'){
            this.setSinglePrompt(idx, e)
        }
        this.combine2(idx)
    }


    renderPrompts(){
        var palette_el = document.getElementById('prompt_palette_board')

        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height

        return this.props.mother_state.prompts.map((val, idx)=>{
            var width = val.position[0]*palette_width
            var height = val.position[1]*palette_height

            return (<circle
                onPointerEnter={this.promptEnter.bind(this, idx)} cx={width} cy={height} r={20} stroke="white" strokeWidth={2} fill={val.color} 
            onPointerDown={this.initMovePrompt.bind(this, idx)} style={{pointerEvents: (this.state.current_prompt==idx)?'none':''}}
            ></circle>)
        })
    }

    combine2(idx){
        console.log(idx)
        if(this.state.current_prompt!=-1 && this.state.action=='move_prompt'){
            if(this.state.current_prompt!=idx){
                var already_included = false
                for(var i in this.props.mother_state.prompt_groups){
                    var cur_prompt_group = this.props.mother_state.prompt_groups[i]
                    if(cur_prompt_group.indexOf(idx)!=-1 && cur_prompt_group.indexOf(this.state.current_prompt)!=-1){
                        if(cur_prompt_group.length==2){
                            this.props.mother_state.prompt_groups.splice(i, 1)
                        }else if(cur_prompt_group.length==3){
                            this.props.mother_state.prompt_groups[i].splice(cur_prompt_group.indexOf(this.state.current_prompt),1)
                        }
                        already_included = true
                        break
                    }
                }
                if(already_included==false){
                    this.props.mother_state.prompt_groups.push([idx, this.state.current_prompt])
                    this.props.mother_this.setState({})
                }
            }
        }
        
    }

    

    renderSelector(){
        var palette_el = document.getElementById('prompt_palette_board')
        var val = this.props.mother_state.selected_prompt
        if (val==undefined){
            return
        }
        if(palette_el==null){
            return
        }
        var palette_width = palette_el.getBoundingClientRect().width
        var palette_height = palette_el.getBoundingClientRect().height

        var width = val.position[0]*palette_width
        var height = val.position[1]*palette_height

        return (<g>
            <circle style={{pointerEvents:'none'}} cx={width} cy={height} stroke='#32cf7d' fill='transparent' r='10'></circle>
            <circle style={{pointerEvents:'none'}} cx={width} cy={height} stroke='white' fill='transparent' r='12'></circle>
        </g>)
    }

    renderBackground(){
        var colors = []
        var weights = []
        for(var i in this.props.mother_state.directional_prompts){
            var dir_prompt = this.props.mother_state.directional_prompts[i]
            if(dir_prompt.value<0){
                colors.push(this.interpolateColors([dir_prompt.colorA, '#333333'], [(-parseFloat(dir_prompt.value))/100, (parseFloat(dir_prompt.value)+100)/100]))
            }else{
                colors.push(this.interpolateColors([dir_prompt.colorB, '#333333'], [(parseFloat(dir_prompt.value))/100, (100-parseFloat(dir_prompt.value))/100]))
            }
            
            weights.push(1/this.props.mother_state.directional_prompts.length)
        }
        var f_color 
        if(colors.length>0){
            f_color= this.interpolateColors(colors, weights)
        }else{
            f_color = 'transparent'
        }
        // console.log(colors)
        return (<svg style={{width:'100%', height:'100%', position:'absolute', zIndex: -1}}>
            <rect width='100%' height='100%' fill={f_color}></rect>
        </svg>)

    }

    render(){
        return (<div className={'prompt_palette'}>
        <div style={{display:'flex', marginBottom: 5, justifyContent:'space-between'}}>
            <div>Prompt Palette</div>
            <div>
            <div class="switch">
                <label>
                Edit
                <input onChange={this.toggleFix.bind(this)} type="checkbox"/>
                <span class="lever"></span>
                Fix
                </label>
            </div>
            </div>
        </div>
        <div style={{flexGrow:1, position:'relative'}}>
        {this.renderBackground()}
        {this.renderMix3_canvas()}
            <svg id={'prompt_palette_board'} style={{height:'100%', width:'100%', border: 'solid 2px white'}} onPointerDown={this.downPointer.bind(this)} onPointerMove={this.movePointer.bind(this)} onPointerUp={this.endPointer.bind(this)}>
                
                {this.renderMix2()}
                {this.renderMix3()}
                {this.renderPrompts()}
                {this.renderSelector()}

            </svg>
            

        </div>
    </div>)
    }
}
export default PromptControllerPalette