// Vercel serverless function: giữ khóa API ở máy chủ, không để lộ trên trình duyệt.
const PERS={
  "Thân thiện":"Bạn thân thiện, ấm áp, hay hỏi lại để hiểu người dùng.",
  "Giáo viên":"Bạn kiên nhẫn như một giáo viên giỏi: giải thích từng bước, cho ví dụ đơn giản và hỏi lại để kiểm tra người học hiểu chưa.",
  "Hài hước":"Bạn vui tính, hay đùa nhẹ nhàng nhưng vẫn trả lời đúng và hữu ích."
};
const hits=new Map();
module.exports=async(req,res)=>{
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  const ip=String(req.headers["x-forwarded-for"]||"anon").split(",")[0].trim();
  const now=Date.now(),arr=(hits.get(ip)||[]).filter(t=>now-t<60000);
  if(arr.length>=15)return res.status(429).json({error:"Quá nhiều yêu cầu, hãy chờ một chút."});
  arr.push(now);hits.set(ip,arr);
  const {messages,persona}=req.body||{};
  const ok=Array.isArray(messages)&&messages.length>0&&messages.length<=20&&messages.every(m=>(m.role==="user"||m.role==="assistant")&&typeof m.content==="string"&&m.content.length>0&&m.content.length<=4000)&&messages[0].role==="user"&&messages[messages.length-1].role==="user";
  if(!ok)return res.status(400).json({error:"Dữ liệu không hợp lệ."});
  const gk=process.env.GEMINI_API_KEY,ak=process.env.ANTHROPIC_API_KEY;
  if(!gk&&!ak)return res.status(500).json({error:"Máy chủ chưa có khóa API."});
  const system="Bạn là Bơ, một chatbot trò chuyện. Luôn trả lời bằng ngôn ngữ người dùng đang viết (mặc định tiếng Việt). "+(PERS[persona]||PERS["Thân thiện"])+" Trả lời ngắn gọn, rõ ràng, viết văn bản thường, không dùng ký hiệu markdown như dấu sao hay dấu thăng. Nếu không chắc, hãy nói thẳng là không chắc.";
  try{
    let text="";
    if(gk){
      // Google Gemini (có gói miễn phí trong Google AI Studio)
      const model=process.env.GEMINI_MODEL||"gemini-3.5-flash";
      let failed=false;
      for(let i=0;i<2&&!text;i++){
        const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+model+":generateContent",{
          method:"POST",
          headers:{"content-type":"application/json","x-goog-api-key":gk},
          body:JSON.stringify({
            systemInstruction:{parts:[{text:system}]},
            contents:messages.map(m=>({role:m.role==="assistant"?"model":"user",parts:[{text:m.content}]})),
            generationConfig:{maxOutputTokens:2048}
          })
        });
        const d=await r.json();
        if(r.status===429)return res.status(429).json({error:"Đã hết lượt miễn phí, hãy thử lại sau."});
        if(!r.ok){failed=true;console.error("Gemini error",r.status,JSON.stringify(d));continue}
        failed=false;
        text=((d.candidates&&d.candidates[0]&&d.candidates[0].content&&d.candidates[0].content.parts)||[]).map(x=>x.text||"").join("");
        if(!text)console.error("Gemini empty reply",JSON.stringify(d).slice(0,600));
      }
      if(!text&&failed)return res.status(502).json({error:"Gemini đang bận, hãy thử lại."});
      if(!text)text="Bơ chưa nghĩ ra câu trả lời. Bạn nói rõ hơn một chút được không?";
    }else{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"content-type":"application/json","x-api-key":ak,"anthropic-version":"2023-06-01"},
        body:JSON.stringify({model:process.env.MODEL||"claude-sonnet-5-5",max_tokens:1000,system,messages})
      });
      const d=await r.json();
      if(!r.ok)return res.status(502).json({error:"Claude đang bận, hãy thử lại."});
      text=(d.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("");
    }
    if(!text)return res.status(502).json({error:"AI chưa trả lời được, hãy thử lại."});
    return res.status(200).json({text});
  }catch(e){console.error(e);return res.status(502).json({error:"Không kết nối được tới AI."})}
};
